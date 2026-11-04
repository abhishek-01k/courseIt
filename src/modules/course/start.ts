import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, courseVideos, enrollments, videos } from "@/db/schema";
import { BUILD_COURSE, inngest } from "@/inngest/client";
import { buildPriority, canRetry, usageFor } from "@/lib/billing";
import { BUILDS_PAUSED_MESSAGE, buildsPaused, stoppedByPause } from "@/lib/builds-paused";
import { COURSE_LIMITS } from "@/lib/constants";
import { newSlug } from "@/lib/paths";
import { PLANS } from "@/lib/plans";
import type { UpgradeReason } from "@/types/course";
import { formatDuration } from "@/lib/utils";
import { fetchCourseSource, parseYouTubeUrl, YouTubeError } from "@/lib/youtube";

type Started = { id: string; slug: string; status: (typeof courses.$inferSelect)["status"] };

/** Enrolls the learner, or moves an enrolled course to the top of Recents. */
export const enroll = (userId: string, courseId: string) =>
  db
    .insert(enrollments)
    .values({ userId, courseId })
    .onConflictDoUpdate({ target: [enrollments.userId, enrollments.courseId], set: { lastOpenedAt: new Date() } });

/**
 * A pasted YouTube link → a course the learner is enrolled in. Already built (or building) by anyone:
 * joins it at no AI cost; failed: resumes it. New: checks the plan's monthly limit and length, saves it and starts
 * the build. Used by New course and by "paste a link" in a roadmap stage.
 */
export async function startCourse(userId: string, url: string): Promise<{ error: string; upgrade?: UpgradeReason } | { course: Started }> {
  const source = parseYouTubeUrl(url);
  if (!source) return { error: "That doesn't look like a YouTube video or playlist link." };

  const [existing] = await db.select({ id: courses.id, slug: courses.slug, status: courses.status, error: courses.error }).from(courses).where(eq(courses.sourceId, source.id));
  if (existing) {
    // Paused: a course that still needs building can't be joined, since that would resume it.
    if (buildsPaused() && existing.status === "failed") return { error: BUILDS_PAUSED_MESSAGE };
    await enroll(userId, existing.id);
    if (existing.status === "failed") {
      // Joining is free, but restarting the build is a retry: Free learners join it and see "Upgrade to retry".
      const usage = await usageFor(userId);
      if (!canRetry(usage) && !stoppedByPause(existing.error)) return { course: existing };
      await db.update(courses).set({ status: "queued", progress: 0, error: null }).where(eq(courses.id, existing.id));
      // Resume, never start over: lessons carry every learner's answers, watch time and notes.
      await inngest.send({ name: BUILD_COURSE, data: { courseId: existing.id, resume: true, plan: buildPriority(usage) } });
      return { course: { id: existing.id, slug: existing.slug, status: "queued" } };
    }
    return { course: { id: existing.id, slug: existing.slug, status: existing.status } };
  }

  if (buildsPaused()) return { error: BUILDS_PAUSED_MESSAGE };

  // Building is what costs money, so it's what each plan limits (src/lib/plans.ts).
  const usage = await usageFor(userId);
  if (usage.left <= 0) {
    const { plan } = usage;
    const up = plan.id === "free" ? PLANS.pro : plan.id === "pro" ? PLANS.max : null;
    const next = up ? `Upgrade to ${up.name} for ${up.coursesPerMonth} a month` : "A slot frees up 30 days after each build";
    return {
      error: plan.lifetime
        ? `You've used your free course. ${next}. Courses already built are always free to join.`
        : `You've built ${usage.used} of ${plan.coursesPerMonth} new ${plan.coursesPerMonth === 1 ? "course" : "courses"} this month on ${plan.name}. ${next}. Courses already built are always free to join.`,
      upgrade: up ? "limit" : undefined,
    };
  }

  let found;
  try {
    found = await fetchCourseSource(source);
  } catch (error) {
    if (error instanceof YouTubeError) return { error: error.message };
    console.error(error);
    return { error: "We couldn't reach YouTube. Try again in a moment." };
  }

  const durationSeconds = found.videos.reduce((total, v) => total + v.durationSeconds, 0);
  const what = source.type === "playlist" ? "That playlist" : "That video";
  if (durationSeconds > COURSE_LIMITS.maxTotalSeconds) {
    return { error: `${what} is ${formatDuration(durationSeconds)} long. We support up to ${COURSE_LIMITS.maxTotalSeconds / 3600} hours for now; try a shorter one.` };
  }
  if (!usage.unlimited && durationSeconds > usage.plan.maxHours * 3600) {
    return {
      error: `${what} is ${formatDuration(durationSeconds)} long. ${usage.plan.name} builds courses up to ${usage.plan.maxHours} hours${usage.plan.id === "max" ? "; try a shorter one" : "; upgrade for longer ones"}.`,
      upgrade: usage.plan.id !== "max" ? "length" : undefined,
    };
  }
  // Hours are what building costs, so each plan also caps the video hours built in any 30 days.
  if (!usage.unlimited && durationSeconds / 3600 > usage.hoursLeft) {
    const left = Math.floor(usage.hoursLeft * 10) / 10;
    return {
      error: `${what} is ${formatDuration(durationSeconds)} long, and you have ${left} of ${usage.plan.hoursPerMonth} hours left ${usage.plan.lifetime ? "on" : "this month on"} ${usage.plan.name}. ${usage.plan.id === "max" ? "Hours free up 30 days after each build" : "Upgrade for more hours"}.`,
      upgrade: usage.plan.id !== "max" ? "hours" : undefined,
    };
  }

  // neon-http has no interactive transactions; batch runs these in one transaction.
  const courseId = crypto.randomUUID();
  const slug = newSlug(found.title);
  try {
    await db.batch([
      db
        .insert(videos)
        .values(found.videos.map((v) => ({ ...v, fetchedAt: new Date() })))
        .onConflictDoNothing(),
      db.insert(courses).values({
        id: courseId,
        sourceType: source.type,
        sourceId: source.id,
        slug,
        title: found.title,
        channel: found.channel,
        thumbnail: found.thumbnail,
        durationSeconds,
        createdBy: userId,
      }),
      db.insert(courseVideos).values(found.videos.map((v, position) => ({ courseId, videoId: v.id, position }))),
      enroll(userId, courseId),
    ]);
  } catch (error) {
    // Someone else started the same video a moment ago: join theirs.
    const [raced] = await db.select({ id: courses.id, slug: courses.slug, status: courses.status }).from(courses).where(eq(courses.sourceId, source.id));
    if (!raced) throw error;
    await enroll(userId, raced.id);
    return { course: raced };
  }

  try {
    await inngest.send({ name: BUILD_COURSE, data: { courseId, plan: buildPriority(usage) } });
  } catch (error) {
    console.error(error);
    await db.update(courses).set({ status: "failed", error: "Couldn't start the build." }).where(eq(courses.id, courseId));
    return { course: { id: courseId, slug, status: "failed" } };
  }
  return { course: { id: courseId, slug, status: "queued" } };
}
