import { and, asc, count, desc, eq, ilike, max, or } from "drizzle-orm";
import { db } from "@/db";
import { courses, lessons, notes } from "@/db/schema";

/** Courses the learner has written notes in, most recently edited first. `q` finds a course or creator. */
export function getNoteCourses(userId: string, q = "") {
  const edited = max(notes.updatedAt);
  const match = q ? or(ilike(courses.title, `%${q}%`), ilike(courses.channel, `%${q}%`)) : undefined;
  return db
    .select({ id: courses.id, slug: courses.slug, title: courses.title, channel: courses.channel, thumbnail: courses.thumbnail, notes: count(), edited })
    .from(notes)
    .innerJoin(courses, eq(courses.id, notes.courseId))
    .where(and(eq(notes.userId, userId), match))
    .groupBy(courses.id)
    .orderBy(desc(edited));
}

/** One course's notes for the learner: lessons in order, each with its notes in video order. Null if no such course. */
export async function getCourseNotes(userId: string, slug: string) {
  const [course] = await db.select({ id: courses.id, slug: courses.slug, title: courses.title, channel: courses.channel, thumbnail: courses.thumbnail }).from(courses).where(eq(courses.slug, slug));
  if (!course) return null;
  const rows = await db
    .select({ id: notes.id, seconds: notes.seconds, body: notes.body, updatedAt: notes.updatedAt, lessonId: lessons.id, position: lessons.position, title: lessons.title, start: lessons.startSeconds })
    .from(notes)
    .innerJoin(lessons, eq(lessons.id, notes.lessonId))
    .where(and(eq(notes.userId, userId), eq(notes.courseId, course.id)))
    .orderBy(asc(lessons.position), asc(notes.seconds), asc(notes.createdAt));

  const byLesson = new Map<string, { id: string; position: number; title: string; start: number; edited: Date; notes: { id: string; seconds: number; body: string }[] }>();
  for (const r of rows) {
    const l = byLesson.get(r.lessonId) ?? { id: r.lessonId, position: r.position, title: r.title, start: r.start, edited: r.updatedAt, notes: [] };
    l.notes.push({ id: r.id, seconds: r.seconds, body: r.body });
    if (r.updatedAt > l.edited) l.edited = r.updatedAt;
    byLesson.set(r.lessonId, l);
  }
  return { ...course, count: rows.length, lessons: [...byLesson.values()] };
}
