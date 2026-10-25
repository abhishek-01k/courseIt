"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { courses, enrollments } from "@/db/schema";
import { BUILD_COURSE, inngest } from "@/inngest/client";
import { auth } from "@/lib/auth";
import { buildPath, coursePath } from "@/lib/paths";
import type { BuildCourseState } from "@/types/course";
import { enroll, startCourse } from "./start";

export async function buildCourseAction(_prev: BuildCourseState, formData: FormData): Promise<BuildCourseState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const result = await startCourse(userId, String(formData.get("url") ?? ""));
  if ("error" in result) return result;
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

  await db.update(courses).set({ status: "queued", error: null }).where(eq(courses.id, courseId));
  await inngest.send({ name: BUILD_COURSE, data: { courseId, resume: true } });
  redirect(buildPath(row.slug));
}
