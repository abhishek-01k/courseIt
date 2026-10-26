import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { attempts, courses, enrollments, lessonProgress, lessonWatch, notes, roadmapFollows, roadmaps, userDays, users } from "@/db/schema";
import { getCoursePlans } from "@/modules/course/queries";

const dayKey = (date: Date, zone: string) => new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(date);

/**
 * Days in a row the learner opened CourseIt, like a daily check-in. Today always counts: they're here.
 * (The visit is also saved by RecordVisit, so tomorrow's count includes it.)
 */
async function getStreak(userId: string, zone: string) {
  const rows = await db.select({ day: userDays.day }).from(userDays).where(eq(userDays.userId, userId)).orderBy(desc(userDays.day)).limit(400);
  const days = new Set(rows.map((r) => r.day));

  // Step back over calendar dates, not 24h blocks, so a 23-hour daylight-saving day can't skip one.
  let day = dayKey(new Date(), zone);
  days.add(day);
  let streak = 0;
  while (days.has(day)) {
    streak++;
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    day = d.toISOString().slice(0, 10);
  }
  return streak;
}

/** The learner's IANA timezone; their "today", greeting and streak follow it. */
export async function getTimezone(userId: string) {
  const [user] = await db.select({ timezone: users.timezone }).from(users).where(eq(users.id, userId));
  return user?.timezone ?? "UTC";
}

/** "Continue": the most recently opened course (first of getMyCourses), its next lesson not done yet, and progress. */
export function getContinue({ course, plan }: MyCourse) {
  const next = plan.lessons.find((l) => !l.done && !l.skipped) ?? null;
  return { course, next, total: plan.lessons.length, finished: plan.lessons.filter((l) => l.done).length, dayCount: plan.dayCount };
}

const WEEK = 7 * 24 * 3600 * 1000;

/** The four tickets on a returning learner's Today: streak, lessons finished, quiz score, time watched (last 7 days). */
export async function getWeekStats(userId: string, zone: string) {
  const since = new Date(Date.now() - WEEK);
  const [streak, [watched], [quizzed], [answers], [seconds]] = await Promise.all([
    getStreak(userId, zone),
    db.select({ ids: sql<string[]>`coalesce(array_agg(${lessonWatch.lessonId}), '{}')` }).from(lessonWatch).where(and(eq(lessonWatch.userId, userId), gte(lessonWatch.watchedAt, since))),
    db.select({ ids: sql<string[]>`coalesce(array_agg(${lessonProgress.lessonId}), '{}')` }).from(lessonProgress).where(and(eq(lessonProgress.userId, userId), gte(lessonProgress.completedAt, since))),
    db
      .select({ total: sql<number>`count(*)::int`, right: sql<number>`count(*) filter (where ${attempts.correct})::int` })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), gte(attempts.createdAt, since))),
    db
      .select({ total: sql<number>`coalesce(sum(cardinality(${lessonWatch.seconds})), 0)::int` })
      .from(lessonWatch)
      .where(and(eq(lessonWatch.userId, userId), gte(lessonWatch.updatedAt, since))),
  ]);
  return {
    streak,
    lessons: new Set([...watched.ids, ...quizzed.ids]).size,
    quizScore: answers.total ? Math.round((answers.right / answers.total) * 100) : null,
    watchedSeconds: seconds.total,
  };
}

/** Up to three courses the learner is taking, most recent first, each with its day plan. */
export async function getMyCourses(userId: string) {
  const list = await db
    .select({ id: courses.id, slug: courses.slug, title: courses.title, channel: courses.channel, thumbnail: courses.thumbnail, status: courses.status })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.lastOpenedAt))
    .limit(3);
  const plans = await getCoursePlans(userId, list.map((c) => c.id));
  return list.map((course) => ({ course, plan: plans.get(course.id)! }));
}
type MyCourse = Awaited<ReturnType<typeof getMyCourses>>[number];

/** "Good morning/afternoon/evening" and today's date, in the learner's own timezone. */
export function getGreeting(zone: string) {
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "numeric", hourCycle: "h23" }).format(now));
  return {
    hello: hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening",
    date: new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "long", month: "short", day: "numeric" }).format(now),
  };
}

/** Numbers next to My courses, Roadmaps and Notes in the sidebar, keyed by their link. */
export async function getSidebarCounts(userId: string) {
  const [[courseCount], [roadmapCount], [noteCount]] = await Promise.all([
    db.select({ n: count() }).from(enrollments).where(eq(enrollments.userId, userId)),
    db
      .select({ n: sql<number>`(select count(*) from ${roadmaps} where ${roadmaps.ownerId} = ${userId}) + (select count(*) from ${roadmapFollows} where ${roadmapFollows.userId} = ${userId})`.mapWith(Number) })
      .from(users)
      .where(eq(users.id, userId)),
    db.select({ n: count() }).from(notes).where(eq(notes.userId, userId)),
  ]);
  return { "/courses": courseCount.n, "/roadmaps": roadmapCount.n, "/notes": noteCount.n };
}
