import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, enrollments, userDays, users } from "@/db/schema";
import { getCoursePlan } from "@/modules/course/queries";

const dayKey = (date: Date, zone: string) => new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(date);

/**
 * Days in a row the learner opened CourseIt, like a daily check-in. Today always counts: they're here.
 * (The visit is also saved by RecordVisit, so tomorrow's count includes it.)
 */
export async function getStreak(userId: string) {
  const [user] = await db.select({ timezone: users.timezone }).from(users).where(eq(users.id, userId));
  const zone = user?.timezone ?? "UTC";
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

/** The most recently opened course, the next lesson not done yet, and where that sits in the day plan. */
export async function getContinue(userId: string) {
  const [recent] = await db
    .select({ id: courses.id, slug: courses.slug, title: courses.title, channel: courses.channel, thumbnail: courses.thumbnail })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.lastOpenedAt))
    .limit(1);
  if (!recent) return null;

  const plan = await getCoursePlan(userId, recent.id);
  const next = plan.lessons.find((l) => !l.done) ?? null;
  return { course: recent, next, total: plan.lessons.length, finished: plan.lessons.filter((l) => l.done).length, dayCount: plan.dayCount };
}
