import { and, asc, count, desc, eq, ilike, ne, or } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { db } from "@/db";
import { attempts, courses, courseSteps, courseVideos, enrollments, lessonProgress, lessons, lessonSkips, lessonWatch, notes, questions, users, videos } from "@/db/schema";
import { packDays } from "@/lib/pace";

export async function getCourseBySlug(slug: string) {
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
  return course ?? null;
}

export function getEnrolledCourses(userId: string, limit?: number) {
  const query = db
    .select({ id: courses.id, slug: courses.slug, title: courses.title, channel: courses.channel, thumbnail: courses.thumbnail, status: courses.status, durationSeconds: courses.durationSeconds })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.lastOpenedAt));
  return limit ? query.limit(limit) : query;
}

/** Opening a course you take moves it to the top of Recents. Opening one you don't take changes nothing. */
export async function touchEnrollment(userId: string, courseId: string) {
  await db
    .update(enrollments)
    .set({ lastOpenedAt: new Date() })
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
}

export async function isEnrolled(userId: string, courseId: string) {
  const [row] = await db
    .select({ userId: enrollments.userId })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
  return Boolean(row);
}

// ponytail: top 60 by learners matching the search; paging when Community has more courses than fit.
export function getCommunityCourses(q = "") {
  const learners = count(enrollments.userId);
  const match = q ? or(ilike(courses.title, `%${q}%`), ilike(courses.channel, `%${q}%`)) : undefined;
  return db
    .select({ id: courses.id, slug: courses.slug, title: courses.title, channel: courses.channel, thumbnail: courses.thumbnail, status: courses.status, durationSeconds: courses.durationSeconds, addedBy: users.name, learners })
    .from(courses)
    .leftJoin(users, eq(users.id, courses.createdBy))
    .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
    .where(and(ne(courses.status, "failed"), match))
    .groupBy(courses.id, users.name)
    .orderBy(desc(learners), desc(courses.createdAt))
    .limit(60);
}

/**
 * The most-taken ready courses, for "Popular courses" on the landing page and a new learner's Today.
 * Cached for an hour, so the landing page stays fast and doesn't hit the database on every visit.
 */
export async function getPopularCourses(limit = 6) {
  "use cache";
  cacheLife("hours");
  const learners = count(enrollments.userId);
  return db
    .select({ id: courses.id, slug: courses.slug, title: courses.title, channel: courses.channel, thumbnail: courses.thumbnail, status: courses.status, durationSeconds: courses.durationSeconds, addedBy: users.name, learners })
    .from(courses)
    .leftJoin(users, eq(users.id, courses.createdBy))
    .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
    .where(eq(courses.status, "ready"))
    .groupBy(courses.id, users.name)
    .orderBy(desc(learners), desc(courses.createdAt))
    .limit(limit);
}

export async function countCommunityCourses() {
  const [{ n }] = await db.select({ n: count() }).from(courses).where(ne(courses.status, "failed"));
  return n;
}

export function getCourseSteps(courseId: string) {
  return db.select().from(courseSteps).where(eq(courseSteps.courseId, courseId)).orderBy(asc(courseSteps.startedAt));
}

/** Lesson `number` (1-based, as in the URL) of a course, with its quiz. */
export async function getLesson(courseId: string, number: number) {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.courseId, courseId), eq(lessons.position, number - 1)));
  if (!lesson) return null;
  const quiz = await db.select().from(questions).where(eq(questions.lessonId, lesson.id)).orderBy(asc(questions.position));
  return { ...lesson, questions: quiz };
}

/** The learner's latest answer per question in a lesson, so a revisited quiz shows where they left off. */
export async function getMyAnswers(userId: string, lessonId: string) {
  const rows = await db
    .selectDistinctOn([attempts.questionId], { questionId: attempts.questionId, chosenIndex: attempts.chosenIndex })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.lessonId, lessonId)))
    .orderBy(attempts.questionId, desc(attempts.createdAt));
  return Object.fromEntries(rows.map((r) => [r.questionId, r.chosenIndex]));
}

export async function getCompletedLessonIds(userId: string, courseId: string) {
  const rows = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseId, courseId)));
  return new Set(rows.map((r) => r.lessonId));
}

/**
 * The learner's day-by-day plan for a course: every lesson with its day (packed from their pace),
 * whether they've watched it (80%) and done its quiz. "today" is the first day with something left.
 */
export async function getCoursePlan(userId: string, courseId: string) {
  const [rows, [user], watched, quizzed, skips] = await Promise.all([
    db
      .select({
        id: lessons.id,
        position: lessons.position,
        title: lessons.title,
        summary: lessons.summary,
        videoId: lessons.videoId,
        startSeconds: lessons.startSeconds,
        endSeconds: lessons.endSeconds,
        ready: lessons.ready,
        thumbnail: videos.thumbnail,
      })
      .from(lessons)
      .innerJoin(videos, eq(videos.id, lessons.videoId))
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.position)),
    db.select({ minutesPerDay: users.minutesPerDay }).from(users).where(eq(users.id, userId)),
    db.select({ lessonId: lessonWatch.lessonId, watchedAt: lessonWatch.watchedAt, watchedSeconds: lessonWatch.watchedSeconds }).from(lessonWatch).where(and(eq(lessonWatch.userId, userId), eq(lessonWatch.courseId, courseId))),
    getCompletedLessonIds(userId, courseId),
    db.select({ lessonId: lessonSkips.lessonId }).from(lessonSkips).where(and(eq(lessonSkips.userId, userId), eq(lessonSkips.courseId, courseId))),
  ]);

  const minutesPerDay = user?.minutesPerDay ?? 90; // a user setting (Settings), the same for every course
  const watch = new Map(watched.map((w) => [w.lessonId, w]));
  const skipped = new Set(skips.map((s) => s.lessonId));
  // Days are packed from the lessons the learner will actually watch; a skipped lesson sits in the day of
  // the next lesson they will watch (or the last day), shown greyed out.
  const kept = rows.filter((l) => !skipped.has(l.id));
  const keptDays = packDays(kept.map((l) => l.endSeconds - l.startSeconds), minutesPerDay);
  const dayOf = new Map(kept.map((l, i) => [l.id, keptDays[i]]));
  const lastDay = keptDays.at(-1) ?? 1;
  const plan = rows.map((l, i) => {
    const w = watch.get(l.id);
    const isWatched = Boolean(w?.watchedAt);
    const quizDone = quizzed.has(l.id);
    const isSkipped = skipped.has(l.id);
    const day = dayOf.get(l.id) ?? dayOf.get(rows.slice(i + 1).find((n) => dayOf.has(n.id))?.id ?? "") ?? lastDay;
    return { ...l, day, skipped: isSkipped, watched: isWatched, watchedSeconds: w?.watchedSeconds ?? 0, quizDone, done: isWatched || quizDone };
  });
  const today = plan.find((l) => !l.done && !l.skipped)?.day ?? null;
  return { minutesPerDay, lessons: plan, dayCount: keptDays.length ? lastDay : 0, today };
}

export type CoursePlan = Awaited<ReturnType<typeof getCoursePlan>>;

/** The learner's notes on a lesson, in video order. */
export function getMyNotes(userId: string, lessonId: string) {
  return db
    .select({ id: notes.id, seconds: notes.seconds, body: notes.body })
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.lessonId, lessonId)))
    .orderBy(asc(notes.seconds), asc(notes.createdAt));
}

/** How many creator chapters the course's videos have (shown on the onboarding screen). */
export async function getChapterCount(courseId: string) {
  const rows = await db
    .select({ chapters: videos.chapters })
    .from(courseVideos)
    .innerJoin(videos, eq(videos.id, courseVideos.videoId))
    .where(eq(courseVideos.courseId, courseId));
  return rows.reduce((total, r) => total + r.chapters.length, 0);
}
