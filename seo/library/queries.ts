import { and, count, desc, eq, sql } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { db } from "@/db";
import { courses, enrollments, lessons } from "@/db/schema";
import { COURSE_TAGS } from "@/lib/course-tags";

export type LibraryCourse = { slug: string; title: string; channel: string; seconds: number; lessons: number; language: string | null };
export type LibraryTopic = { id: string; label: string; courses: LibraryCourse[] };

/**
 * Every ready, public course, grouped by its first topic (in COURSE_TAGS order), English first and then most-joined
 * within a topic. Cached for an hour; this is the crawl path from the site to every course page.
 */
export async function getLibrary(): Promise<{ total: number; topics: LibraryTopic[] }> {
  "use cache";
  cacheLife("hours");
  const lessonCount = db.$with("lesson_count").as(db.select({ courseId: lessons.courseId, n: count().as("n") }).from(lessons).groupBy(lessons.courseId));
  const rows = await db
    .with(lessonCount)
    .select({
      slug: courses.slug,
      title: courses.title,
      channel: courses.channel,
      seconds: courses.durationSeconds,
      language: courses.language,
      tags: courses.tags,
      lessons: sql<number>`coalesce(${lessonCount.n}, 0)`.mapWith(Number),
      learners: count(enrollments.userId),
    })
    .from(courses)
    .leftJoin(lessonCount, eq(lessonCount.courseId, courses.id))
    .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
    .where(and(eq(courses.status, "ready"), eq(courses.isPrivate, false)))
    .groupBy(courses.id, lessonCount.n)
    .orderBy(desc(sql`${courses.language} = 'english'`), desc(count(enrollments.userId)), desc(courses.createdAt));

  const withLessons = rows.filter((r) => r.lessons > 0);
  const order = COURSE_TAGS.map((t) => t.id as string);
  const topics = new Map<string, LibraryCourse[]>(order.map((id) => [id, []]));
  for (const r of withLessons) {
    const topic = order.find((id) => r.tags.includes(id)) ?? "other";
    topics.get(topic)!.push({ slug: r.slug, title: r.title, channel: r.channel, seconds: r.seconds, lessons: r.lessons, language: r.language });
  }
  return {
    total: withLessons.length,
    topics: COURSE_TAGS.map((t) => ({ id: t.id, label: t.label, courses: topics.get(t.id)! })).filter((t) => t.courses.length > 0),
  };
}
