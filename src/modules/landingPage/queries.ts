import { and, count, countDistinct, eq, sql, sum } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { db } from "@/db";
import { courses, lessons, questions, users } from "@/db/schema";

/**
 * Real numbers for "By the numbers" on the landing page, straight from the database. Cached for an hour, so the
 * landing page stays fast and the figures stay current without anyone updating them by hand.
 */
export async function getPlatformStats() {
  "use cache";
  cacheLife("hours");
  const ready = eq(courses.status, "ready");
  const [[learners], [built], [lessonCount], [questionCount]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db
      .select({
        n: count(),
        // Private courses (Pro and Max) count as built, but only public ones can be joined by anyone.
        public: count(sql`case when not ${courses.isPrivate} then 1 end`),
        seconds: sum(courses.durationSeconds).mapWith(Number),
        channels: countDistinct(courses.channel),
      })
      .from(courses)
      .where(ready),
    db.select({ n: count() }).from(lessons).innerJoin(courses, eq(courses.id, lessons.courseId)).where(and(ready, eq(lessons.ready, true))),
    db.select({ n: count() }).from(questions),
  ]);
  return {
    learners: learners.n,
    courses: built.n,
    publicCourses: built.public,
    videoHours: Math.floor((built.seconds ?? 0) / 3600),
    channels: built.channels,
    lessons: lessonCount.n,
    questions: questionCount.n,
  };
}
