"use server";

import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { BUILD_COURSE, inngest } from "@/inngest/client";
import { auth } from "@/lib/auth";
import { buildPriority, canRetry, usageFor } from "@/lib/billing";
import { BUILDS_PAUSED_MESSAGE, buildsPaused, stoppedByPause } from "@/lib/builds-paused";
import { buildPath, coursePath } from "@/lib/paths";
import type { BuildCourseState } from "@/types/course";
import { enroll, resumeRefusal, startCourse } from "./start";

export async function buildCourseAction(_prev: BuildCourseState, formData: FormData): Promise<BuildCourseState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const result = await startCourse(userId, String(formData.get("url") ?? ""));
  if ("error" in result) {
    if (result.upgrade) redirect(`/plans?reason=${result.upgrade}`);
    return result;
  }
  // Already built: open it. Still building (or just started): the onboarding screen.
  const { course } = result;
  redirect(course.status === "ready" ? coursePath(course.slug) : buildPath(course.slug));
}

/** "Enroll in this course" from the course page menu: it joins My courses, Recents and Today. */
export async function enrollAction(courseId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const [course] = await db.select({ id: courses.id, isPrivate: courses.isPrivate, createdBy: courses.createdBy }).from(courses).where(eq(courses.id, courseId));
  if (!course || (course.isPrivate && course.createdBy !== userId)) return;
  await enroll(userId, course.id);
  refresh();
}

/** A private course's builder shares it with everyone. One way only: a public course can't be made private again. */
export async function makeCoursePublicAction(courseId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const [course] = await db.select({ slug: courses.slug, isPrivate: courses.isPrivate, createdBy: courses.createdBy }).from(courses).where(eq(courses.id, courseId));
  if (!course?.isPrivate || course.createdBy !== userId) return { error: "Only the person who built this course can share it." };
  try {
    await db.update(courses).set({ isPrivate: false }).where(eq(courses.id, courseId));
  } catch {
    // One public course per video: someone has built a public one since.
    return { error: "Someone has already shared a public course for this video, so this one stays private." };
  }
  updateTag(`course-preview:${course.slug}`); // link previews cached it as hidden
  refresh();
}

/** Retry a failed or partly built course: keeps the plan and finished lessons, writes only what's missing. */
export async function retryCourseAction(courseId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const [row] = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      status: courses.status,
      error: courses.error,
      durationSeconds: courses.durationSeconds,
      createdBy: courses.createdBy,
      sourceType: courses.sourceType,
      isPrivate: courses.isPrivate,
    })
    .from(courses)
    .where(eq(courses.id, courseId));
  // Only when something actually failed, and never someone else's private course.
  if (row?.isPrivate && row.createdBy !== userId) return { error: "This course doesn't need a retry." };
  if (!row || !(row.status === "failed" || (row.status === "ready" && row.error))) return { error: "This course doesn't need a retry." };
  if (buildsPaused()) return { error: BUILDS_PAUSED_MESSAGE };
  const usage = await usageFor(userId);
  if (!canRetry(usage) && !stoppedByPause(row.error)) redirect("/plans?reason=retry");
  // A build that never finished a lesson needs the hours on the plan of whoever restarts it.
  const refused = await resumeRefusal(userId, usage, row);
  if (refused) {
    if (refused.upgrade) redirect(`/plans?reason=${refused.upgrade}`);
    return { error: refused.error };
  }

  // Anyone who opens a failed course sees Retry; restarting it also adds it to their courses.
  await enroll(userId, courseId);
  await db.update(courses).set({ status: "queued", error: null }).where(eq(courses.id, courseId));
  await inngest.send({ name: BUILD_COURSE, data: { courseId, resume: true, plan: buildPriority(usage) } });
  redirect(buildPath(row.slug));
}
