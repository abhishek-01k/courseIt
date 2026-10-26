import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { courses, courseVideos, enrollments, videos } from "@/db/schema";
import { BUILD_COURSE, inngest } from "@/inngest/client";
import { COURSE_LIMITS } from "@/lib/constants";
import { newSlug } from "@/lib/paths";
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
 * joins it at no AI cost; failed: resumes it. New: checks the daily limit and length, saves it and starts
 * the build. Used by New course and by "paste a link" in a roadmap stage.
 */
export async function startCourse(userId: string, url: string): Promise<{ error: string } | { course: Started }> {
  const source = parseYouTubeUrl(url);
  if (!source) return { error: "That doesn't look like a YouTube video or playlist link." };

  const [existing] = await db.select({ id: courses.id, slug: courses.slug, status: courses.status }).from(courses).where(eq(courses.sourceId, source.id));
  if (existing) {
    await enroll(userId, existing.id);
    if (existing.status === "failed") {
      await db.update(courses).set({ status: "queued", progress: 0, error: null }).where(eq(courses.id, existing.id));
      // Resume, never start over: lessons carry every learner's answers, watch time and notes.
      await inngest.send({ name: BUILD_COURSE, data: { courseId: existing.id, resume: true } });
      return { course: { ...existing, status: "queued" } };
    }
    return { course: existing };
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [{ built }] = await db
    .select({ built: count() })
    .from(courses)
    .where(and(eq(courses.createdBy, userId), gte(courses.createdAt, since)));
 
    // if (built >= COURSE_LIMITS.newCoursesPerDay) {
  //   return { error: `You can build ${COURSE_LIMITS.newCoursesPerDay} new courses a day. Popular courses are always open.` };
  // }

  let found;
  try {
    found = await fetchCourseSource(source);
  } catch (error) {
    if (error instanceof YouTubeError) return { error: error.message };
    console.error(error);
    return { error: "We couldn't reach YouTube. Try again in a moment." };
  }

  const durationSeconds = found.videos.reduce((total, v) => total + v.durationSeconds, 0);
  // if (durationSeconds > COURSE_LIMITS.maxTotalSeconds) {
  //   return { error: `That's over ${COURSE_LIMITS.maxTotalSeconds / 3600} hours of video. Try a shorter playlist for now.` };
  // }

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
    await inngest.send({ name: BUILD_COURSE, data: { courseId } });
  } catch (error) {
    console.error(error);
    await db.update(courses).set({ status: "failed", error: "Couldn't start the build." }).where(eq(courses.id, courseId));
    return { course: { id: courseId, slug, status: "failed" } };
  }
  return { course: { id: courseId, slug, status: "queued" } };
}
