"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { attempts, courses, lessonProgress, lessons, lessonWatch, notes, questions, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { findReading } from "@/lib/tavily";

const validZone = (zone: string) => {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

/** Saves one quiz answer. Correctness is checked here, never trusted from the browser. */
export async function saveAnswerAction(questionId: string, chosenIndex: number, timezone: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !Number.isInteger(chosenIndex)) return;

  const [question] = await db
    .select({ answerIndex: questions.answerIndex, lessonId: questions.lessonId, courseId: lessons.courseId })
    .from(questions)
    .innerJoin(lessons, eq(lessons.id, questions.lessonId))
    .where(eq(questions.id, questionId));
  if (!question) return;

  const zone = validZone(timezone) ? timezone : "UTC";
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(new Date()); // YYYY-MM-DD
  await db.batch([
    db.insert(attempts).values({ userId, questionId, lessonId: question.lessonId, courseId: question.courseId, chosenIndex, correct: chosenIndex === question.answerIndex, day }),
    db.update(users).set({ timezone: zone }).where(eq(users.id, userId)),
  ]);

  // Done once every question has an answer. Score = right on the first try.
  const [all, mine] = await Promise.all([
    db.select({ id: questions.id }).from(questions).where(eq(questions.lessonId, question.lessonId)),
    db
      .select({ questionId: attempts.questionId, correct: attempts.correct })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.lessonId, question.lessonId)))
      .orderBy(attempts.createdAt),
  ]);
  const first = new Map<string, boolean>();
  for (const a of mine) if (!first.has(a.questionId)) first.set(a.questionId, a.correct);
  if (all.every((q) => first.has(q.id))) {
    const score = [...first.values()].filter(Boolean).length;
    const [added] = await db
      .insert(lessonProgress)
      .values({ userId, lessonId: question.lessonId, courseId: question.courseId, score, total: all.length })
      .onConflictDoNothing()
      .returning({ lessonId: lessonProgress.lessonId });
    if (added) refresh(); // first completion: the playlist ticks the lesson off right away
  }
}

/** The learner's own notes on a lesson; saved as they type. */
export type Note = { id: string; seconds: number; body: string };

/** A note pinned to a moment of the lesson (`seconds` = position in the whole video, kept inside the lesson). */
export async function addNoteAction(lessonId: string, seconds: number, body: string): Promise<Note | null> {
  const session = await auth();
  const userId = session?.user?.id;
  const text = body.trim().slice(0, 5_000);
  if (!userId || !text || !Number.isFinite(seconds)) return null;
  const [lesson] = await db.select({ courseId: lessons.courseId, start: lessons.startSeconds, end: lessons.endSeconds }).from(lessons).where(eq(lessons.id, lessonId));
  if (!lesson) return null;
  const at = Math.round(Math.min(lesson.end - 1, Math.max(lesson.start, seconds)));
  const [note] = await db.insert(notes).values({ userId, lessonId, courseId: lesson.courseId, seconds: at, body: text }).returning({ id: notes.id, seconds: notes.seconds, body: notes.body });
  return note;
}

/** Edit a note's text (only your own). An empty text deletes it. */
export async function updateNoteAction(noteId: string, body: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;
  const text = body.trim().slice(0, 5_000);
  const mine = and(eq(notes.id, noteId), eq(notes.userId, userId));
  if (!text) await db.delete(notes).where(mine);
  else await db.update(notes).set({ body: text, updatedAt: new Date() }).where(mine);
}

export async function deleteNoteAction(noteId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;
  await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
}

/** "Mark as completed": counts the lesson as done (the same as watching 80% of it). */
export async function markLessonDoneAction(lessonId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;
  const [lesson] = await db.select({ courseId: lessons.courseId }).from(lessons).where(eq(lessons.id, lessonId));
  if (!lesson) return;
  await db
    .insert(lessonWatch)
    .values({ userId, lessonId, courseId: lesson.courseId, watchedAt: new Date() })
    .onConflictDoUpdate({ target: [lessonWatch.userId, lessonWatch.lessonId], set: { watchedAt: sql`coalesce(${lessonWatch.watchedAt}, now())`, updatedAt: new Date() } });
}

/**
 * "Find further reading" on a lesson: one Tavily search, saved on the lesson so every learner sees it after that.
 * The lesson is claimed first (reading_at set only if empty), so double taps or two learners at once cost one credit.
 * If Tavily can't be reached, the claim is released so it can be tried again; if it finds nothing, that's final.
 */
export async function findReadingAction(lessonId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Sign in to find further reading." };

  const [row] = await db
    .select({ title: lessons.title, course: courses.title, isPrivate: courses.isPrivate, createdBy: courses.createdBy })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(eq(lessons.id, lessonId));
  if (!row || (row.isPrivate && row.createdBy !== userId)) return { error: "This lesson isn't available." };

  const claimed = await db.update(lessons).set({ readingAt: new Date() }).where(and(eq(lessons.id, lessonId), isNull(lessons.readingAt))).returning({ id: lessons.id });
  if (!claimed.length) {
    refresh(); // someone already searched: show what they found
    return;
  }
  const reading = await findReading(`${row.title} (${row.course})`);
  if (reading === null) {
    await db.update(lessons).set({ readingAt: null }).where(eq(lessons.id, lessonId));
    return { error: "Couldn't search the web right now. Try again in a moment." };
  }
  await db.update(lessons).set({ reading }).where(eq(lessons.id, lessonId));
  refresh();
}
