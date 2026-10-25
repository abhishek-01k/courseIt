"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { courses, enrollments, lessons, lessonSkips, placementQuestions, placementResults } from "@/db/schema";
import { auth } from "@/lib/auth";
import { gradePlacement } from "@/lib/placement";

/** Grades the placement test on the server (see gradePlacement). A retake replaces the earlier result and skips. */
export async function submitPlacementAction(courseId: string, answers: Record<string, number>) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [course] = await db.select({ slug: courses.slug }).from(courses).where(eq(courses.id, courseId));
  const test = await db.select().from(placementQuestions).where(eq(placementQuestions.courseId, courseId));
  if (!course || !test.length) return;

  const courseLessons = await db.select({ id: lessons.id, position: lessons.position }).from(lessons).where(eq(lessons.courseId, courseId));
  const { score, skip } = gradePlacement(test, answers, courseLessons);

  const clean = Object.fromEntries(test.map((q) => [q.id, Number.isInteger(answers[q.id]) ? answers[q.id] : -1]));
  await db.batch([
    db.insert(enrollments).values({ userId, courseId }).onConflictDoNothing(),
    db
      .insert(placementResults)
      .values({ userId, courseId, answers: clean, score, total: test.length })
      .onConflictDoUpdate({ target: [placementResults.userId, placementResults.courseId], set: { answers: clean, score, total: test.length, createdAt: new Date() } }),
    db.delete(lessonSkips).where(and(eq(lessonSkips.userId, userId), eq(lessonSkips.courseId, courseId))),
    ...(skip.length ? [db.insert(lessonSkips).values(skip.map((lessonId) => ({ userId, courseId, lessonId })))] : []),
  ]);
  redirect(`/build/${course.slug}/result`);
}

/** The switch on each lesson of the result screen: skip it, or watch it anyway. */
export async function setSkipAction(courseId: string, lessonId: string, skip: boolean) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;
  const [lesson] = await db.select({ id: lessons.id }).from(lessons).where(and(eq(lessons.id, lessonId), eq(lessons.courseId, courseId)));
  if (!lesson) return;
  if (skip) await db.insert(lessonSkips).values({ userId, courseId, lessonId }).onConflictDoNothing();
  else await db.delete(lessonSkips).where(and(eq(lessonSkips.userId, userId), eq(lessonSkips.lessonId, lessonId)));
  refresh();
}
