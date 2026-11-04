"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { courses, enrollments } from "@/db/schema";
import { BUILD_COURSE, inngest } from "@/inngest/client";
import { auth } from "@/lib/auth";
import { buildPriority, canRetry, usageFor } from "@/lib/billing";
import { BUILDS_PAUSED_MESSAGE, buildsPaused, stoppedByPause } from "@/lib/builds-paused";
import { buildPath, coursePath } from "@/lib/paths";
import type { BuildCourseState } from "@/types/course";
import { enroll, startCourse } from "./start";

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
  const [course] = await db.select({ id: courses.id }).from(courses).where(eq(courses.id, courseId));
  if (!course) return;
  await enroll(userId, course.id);
  refresh();
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
  if (buildsPaused()) return { error: BUILDS_PAUSED_MESSAGE };
  const usage = await usageFor(userId);
  if (!canRetry(usage) && !stoppedByPause(row.error)) redirect("/plans?reason=retry");

  await db.update(courses).set({ status: "queued", error: null }).where(eq(courses.id, courseId));
  await inngest.send({ name: BUILD_COURSE, data: { courseId, resume: true, plan: buildPriority(usage) } });
  redirect(buildPath(row.slug));
}
