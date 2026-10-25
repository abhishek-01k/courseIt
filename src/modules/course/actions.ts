"use server";

import { and, count, eq, gte } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { courses, courseVideos, enrollments, lessons, videos } from "@/db/schema";
import { BUILD_COURSE, inngest } from "@/inngest/client";
import { auth } from "@/lib/auth";
import { COURSE_LIMITS } from "@/lib/constants";
import { coursePath, newSlug } from "@/lib/paths";
import { fetchCourseSource, parseYouTubeUrl, YouTubeError } from "@/lib/youtube";
import type { BuildCourseState } from "@/types/course";

const enroll = (userId: string, courseId: string) =>
  db
    .insert(enrollments)
    .values({ userId, courseId })
    .onConflictDoUpdate({ target: [enrollments.userId, enrollments.courseId], set: { lastOpenedAt: new Date() } });

export async function buildCourseAction(_prev: BuildCourseState, formData: FormData): Promise<BuildCourseState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const source = parseYouTubeUrl(String(formData.get("url") ?? ""));
  if (!source) return { error: "That doesn't look like a YouTube video or playlist link." };

  // Already built (or building) by anyone: open it instantly, no AI cost.
  const [existing] = await db.select({ id: courses.id, slug: courses.slug, status: courses.status }).from(courses).where(eq(courses.sourceId, source.id));
  if (existing) {
    await enroll(userId, existing.id);
    if (existing.status === "failed") {
      await db.update(courses).set({ status: "queued", progress: 0, error: null }).where(eq(courses.id, existing.id));
      // Resume, never start over: lessons carry every learner's answers, watch time and notes.
      await inngest.send({ name: BUILD_COURSE, data: { courseId: existing.id, resume: true } });
    }
    redirect(coursePath(existing.slug));
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [{ built }] = await db
    .select({ built: count() })
    .from(courses)
    .where(and(eq(courses.createdBy, userId), gte(courses.createdAt, since)));
  if (built >= COURSE_LIMITS.newCoursesPerDay) {
    return { error: `You can build ${COURSE_LIMITS.newCoursesPerDay} new courses a day. Popular courses are always open.` };
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
  if (durationSeconds > COURSE_LIMITS.maxTotalSeconds) {
    return { error: `That's over ${COURSE_LIMITS.maxTotalSeconds / 3600} hours of video. Try a shorter playlist for now.` };
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
    const [raced] = await db.select({ id: courses.id, slug: courses.slug }).from(courses).where(eq(courses.sourceId, source.id));
    if (!raced) throw error;
    await enroll(userId, raced.id);
    redirect(coursePath(raced.slug));
  }

  try {
    await inngest.send({ name: BUILD_COURSE, data: { courseId } });
  } catch (error) {
    console.error(error);
    await db.update(courses).set({ status: "failed", error: "Couldn't start the build." }).where(eq(courses.id, courseId));
  }
  redirect(coursePath(slug));
}

/** Retry a failed or partly built course: keeps the plan and finished lessons, writes only what's missing. */
export async function retryCourseAction(courseId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const [row] = await db
    .select({ slug: courses.slug, status: courses.status, error: courses.error })
    .from(courses)
    .innerJoin(enrollments, and(eq(enrollments.courseId, courses.id), eq(enrollments.userId, userId)))
    .where(eq(courses.id, courseId));
  // Only learners taking the course, and only when something actually failed.
  if (!row || !(row.status === "failed" || (row.status === "ready" && row.error))) return;

  await db.update(courses).set({ status: "queued", error: null }).where(eq(courses.id, courseId));
  await inngest.send({ name: BUILD_COURSE, data: { courseId, resume: true } });
  redirect(coursePath(row.slug));
}

/** The learner's pace in minutes a day. Days are re-packed from it; the page refreshes to show them. */
export async function setPaceAction(courseId: string, minutesPerDay: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  if (!Number.isFinite(minutesPerDay)) return;
  const minutes = Math.round(Math.min(Math.max(minutesPerDay, 5), 480));
  const [lesson] = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.courseId, courseId)).limit(1);
  if (!lesson) return;
  await db
    .insert(enrollments)
    .values({ userId, courseId, minutesPerDay: minutes })
    .onConflictDoUpdate({ target: [enrollments.userId, enrollments.courseId], set: { minutesPerDay: minutes } });
  refresh();
}
