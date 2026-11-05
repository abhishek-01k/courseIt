import { and, count, desc, eq, inArray, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { courses, courseVideos, enrollments, lessons, videos, videoSegments } from "@/db/schema";
import { BUILD_COURSE, inngest } from "@/inngest/client";
import { buildBlock, buildPriority, canRetry, isPaid, paymentsLive, readUsage, shortDate, type Usage, usageFor } from "@/lib/billing";
import { BUILDS_PAUSED_MESSAGE, buildsPaused, NO_CAPTIONS_ERROR, noCaptions, stoppedByPause } from "@/lib/builds-paused";
import { COURSE_LIMITS } from "@/lib/constants";
import { newSlug } from "@/lib/paths";
import { formatHours, PLANS } from "@/lib/plans";
import type { UpgradeReason } from "@/types/course";
import { fetchTranscripts } from "@/lib/transcript";
import { formatDuration } from "@/lib/utils";
import { fetchCourseSource, parseYouTubeUrl, YouTubeError } from "@/lib/youtube";

type Started = { id: string; slug: string; status: (typeof courses.$inferSelect)["status"] };

/** Enrolls the learner, or moves an enrolled course to the top of Recents. */
export const enroll = (userId: string, courseId: string) =>
  db
    .insert(enrollments)
    .values({ userId, courseId })
    .onConflictDoUpdate({ target: [enrollments.userId, enrollments.courseId], set: { lastOpenedAt: new Date() } });

type Refusal = { error: string; upgrade?: UpgradeReason };

/** Why the learner's plan can't build `seconds` of video right now (too long for the plan, or not enough hours left), or null. */
export function planRefusal(usage: Usage, seconds: number, what: string): Refusal | null {
  if (usage.unlimited) return null;
  const { plan } = usage;
  // No upgrade to offer until payments are live.
  const up = !paymentsLive() ? null : plan.id === "free" ? PLANS.pro : plan.id === "pro" ? PLANS.max : null;
  const soon = plan.launch ? " Pro and Max are coming soon." : "";
  const blocked = buildBlock(usage);
  if (blocked) {
    const join = blocked.detail.includes("free to join") ? "" : " Courses already built are always free to join.";
    return { error: `${blocked.title}. ${blocked.detail}${join}`, upgrade: blocked.upgrade ? "limit" : undefined };
  }
  if (seconds > plan.maxHours * 3600) {
    return {
      error: up
        ? `${what} is ${formatDuration(seconds)} long. ${plan.name} builds courses up to ${plan.maxHours} hours; ${up.name} goes up to ${up.maxHours}.`
        : `${what} is ${formatDuration(seconds)} long. Courses can be up to ${plan.maxHours} hours for now; try a shorter one.${soon}`,
      upgrade: up ? "length" : undefined,
    };
  }
  if (seconds / 3600 > usage.hoursLeft) {
    const back = usage.hoursBackAt ? shortDate(usage.hoursBackAt) : null;
    return {
      error: `${what} is ${formatDuration(seconds)} long, and you have ${formatHours(usage.hoursLeft)} of ${plan.hoursPerMonth} hours left this month.${
        back ? (plan.id === "free" ? ` Your hours renew on ${back}.` : ` Hours start coming back on ${back}.`) : ""
      }${up ? ` ${up.name} gives you ${up.hoursPerMonth} hours a month.` : soon}`,
      upgrade: up ? "hours" : undefined,
    };
  }
  return null;
}

/**
 * Restarting a failed build. One that never finished a lesson is a new build in all but name, so whoever restarts it
 * needs the hours for it, and from then on it counts as theirs, from today. One with lessons just finishes what's
 * missing. Returns why it can't be restarted, or null (after taking it over when needed).
 */
export async function resumeRefusal(
  userId: string,
  usage: Usage,
  course: { id: string; error: string | null; durationSeconds: number; createdBy: string | null; sourceType: string },
): Promise<Refusal | null> {
  if (noCaptions(course.error)) return { error: NO_CAPTIONS_ERROR };
  const [{ built }] = await db.select({ built: count() }).from(lessons).where(and(eq(lessons.courseId, course.id), eq(lessons.ready, true)));
  if (built > 0) return null;
  const refused = planRefusal(usage, course.durationSeconds, course.sourceType === "playlist" ? "That playlist" : "That video");
  if (refused) return refused;
  await db.update(courses).set({ createdBy: userId, createdAt: new Date() }).where(eq(courses.id, course.id));
  return null;
}

/**
 * A pasted YouTube link → a course the learner is enrolled in. Already built (or building) by anyone:
 * joins it at no AI cost; failed: resumes it if their plan allows. New: checks the plan's limits and the video's
 * captions, saves it and starts the build. Used by New course and by "paste a link" in a roadmap stage.
 */
export async function startCourse(userId: string, url: string): Promise<Refusal | { course: Started }> {
  const source = parseYouTubeUrl(url);
  if (!source) return { error: "That doesn't look like a YouTube video or playlist link." };
  // The course this link already has, for this learner: the public one, or a private one they built themselves.
  // Someone else's private course doesn't count; this learner gets their own (the saved transcript is shared).
  const visible = and(eq(courses.sourceId, source.id), or(eq(courses.isPrivate, false), eq(courses.createdBy, userId)));

  const [existing] = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      status: courses.status,
      error: courses.error,
      durationSeconds: courses.durationSeconds,
      createdBy: courses.createdBy,
      sourceType: courses.sourceType,
    })
    .from(courses)
    .where(visible)
    .orderBy(desc(courses.isPrivate)); // their own private copy first
  if (existing) {
    // Paused: a course that still needs building can't be joined, since that would resume it.
    if (buildsPaused() && existing.status === "failed") return { error: BUILDS_PAUSED_MESSAGE };
    await enroll(userId, existing.id);
    const course = { id: existing.id, slug: existing.slug, status: existing.status };
    if (existing.status === "failed") {
      // Joining is free, but restarting the build is a retry: Free learners join it and see "Upgrade to retry".
      const usage = await usageFor(userId);
      if (!canRetry(usage) && !stoppedByPause(existing.error)) return { course };
      // Can't restart it on this plan: they join it, and Retry on the course page says why.
      if (await resumeRefusal(userId, usage, existing)) return { course };
      await db.update(courses).set({ status: "queued", progress: 0, error: null }).where(eq(courses.id, existing.id));
      // Resume, never start over: lessons carry every learner's answers, watch time and notes.
      await inngest.send({ name: BUILD_COURSE, data: { courseId: existing.id, resume: true, plan: buildPriority(usage) } });
      return { course: { ...course, status: "queued" } };
    }
    return { course };
  }

  if (buildsPaused()) return { error: BUILDS_PAUSED_MESSAGE };

  // Building is what costs money, so each plan limits the hours of video built per month (src/lib/plans.ts).
  const usage = await usageFor(userId);
  const blocked = planRefusal(usage, 0, "");
  if (blocked) return blocked;

  let found;
  try {
    found = await fetchCourseSource(source);
  } catch (error) {
    if (error instanceof YouTubeError) return { error: error.message };
    console.error(error);
    return { error: "We couldn't reach YouTube. Try again in a moment." };
  }

  const what = source.type === "playlist" ? "That playlist" : "That video";
  const fullSeconds = found.videos.reduce((total, v) => total + v.durationSeconds, 0);
  if (fullSeconds > COURSE_LIMITS.maxTotalSeconds) {
    return { error: `${what} is ${formatDuration(fullSeconds)} long. We support up to ${COURSE_LIMITS.maxTotalSeconds / 3600} hours for now; try a shorter one.` };
  }

  // The plan's limits, checked before spending anything on captions. Dropping a playlist's videos without captions
  // can only make it shorter, so a playlist that's too long here is refused too (rarely, one that would have fit).
  const refused = planRefusal(usage, fullSeconds, what);
  if (refused) return refused;

  // Courses are built from the video's own captions only. Check them now, before anything is saved or counted:
  // a video without captions is refused, and a playlist keeps only the videos that have them. The transcripts
  // fetched here are saved below, so the build doesn't pay Supadata for them again.
  const ids = found.videos.map((v) => v.id);
  const saved = new Set(
    (await db.select({ id: videoSegments.videoId }).from(videoSegments).where(and(inArray(videoSegments.videoId, ids), eq(videoSegments.model, "supadata")))).map(
      (r) => r.id,
    ),
  );
  let transcripts: Map<string, string | null>;
  try {
    transcripts = await fetchTranscripts(ids.filter((id) => !saved.has(id)));
  } catch (error) {
    console.error(error);
    return { error: "We couldn't check that video's captions. Try again in a moment." };
  }
  const kept = found.videos.filter((v) => saved.has(v.id) || transcripts.get(v.id));
  if (!kept.length) {
    return {
      error:
        source.type === "playlist"
          ? "None of the videos in that playlist have captions, so we can't build a course from it. Try another playlist."
          : "That video has no captions, so we can't build a course from it. Try another video.",
    };
  }
  const fresh = kept.filter((v) => transcripts.get(v.id));
  const durationSeconds = kept.reduce((total, v) => total + v.durationSeconds, 0);

  // neon-http has no interactive transactions; batch runs these in one transaction.
  const courseId = crypto.randomUUID();
  const slug = newSlug(found.title);
  try {
    await db.batch([
      db
        .insert(videos)
        .values(kept.map((v) => ({ ...v, fetchedAt: new Date() })))
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
        // Pro and Max courses are private by default (only the builder sees them); they can make one public later.
        // Free courses are public and shared in Community. Either way, only the transcript is reused for others.
        isPrivate: isPaid(usage),
      }),
      db.insert(courseVideos).values(kept.map((v, position) => ({ courseId, videoId: v.id, position }))),
      // Old partial notes from the Gemini reader would mix with the full transcript.
      ...(fresh.length ? [db.delete(videoSegments).where(and(inArray(videoSegments.videoId, fresh.map((v) => v.id)), ne(videoSegments.model, "supadata")))] : []),
      ...fresh.map((v) =>
        db
          .insert(videoSegments)
          .values({ videoId: v.id, startSeconds: 0, endSeconds: v.durationSeconds, notes: transcripts.get(v.id)!, model: "supadata" })
          .onConflictDoNothing(),
      ),
      enroll(userId, courseId),
    ]);
  } catch (error) {
    // Someone else started the same video a moment ago: join theirs.
    const [raced] = await db.select({ id: courses.id, slug: courses.slug, status: courses.status }).from(courses).where(visible);
    if (!raced) throw error;
    await enroll(userId, raced.id);
    return { course: raced };
  }

  // Two builds started at the same moment (two tabs) could each pass the check above. Count again now that this one
  // is saved, and back it out if together they went over the plan. Only courses started up to this one count, so the
  // earlier of the two always survives and only the later one is backed out.
  if (!usage.unlimited) {
    const after = await readUsage(userId, courseId);
    if (after.hoursUsed > after.plan.hoursPerMonth + 0.01 || (after.plan.coursesPerMonth && after.coursesUsed > after.plan.coursesPerMonth)) {
      await db.delete(courses).where(eq(courses.id, courseId));
      return { error: "Another course you started at the same time used up your hours. Wait for it to finish, then try again." };
    }
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
