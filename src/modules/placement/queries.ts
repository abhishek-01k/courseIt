import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessons, placementQuestions, placementResults } from "@/db/schema";

/** The test as the learner sees it: no answers or explanations leave the server. */
export async function getPlacementTest(courseId: string) {
  const [rows, lessonRows] = await Promise.all([
    db
      .select({ id: placementQuestions.id, prompt: placementQuestions.prompt, options: placementQuestions.options, lessonIds: placementQuestions.lessonIds })
      .from(placementQuestions)
      .where(eq(placementQuestions.courseId, courseId))
      .orderBy(asc(placementQuestions.position)),
    db.select({ id: lessons.id, position: lessons.position, title: lessons.title }).from(lessons).where(eq(lessons.courseId, courseId)),
  ]);
  const byId = new Map(lessonRows.map((l) => [l.id, l]));
  return rows.map(({ lessonIds, ...q }) => {
    const covered = lessonIds.map((id) => byId.get(id)).filter((l) => l !== undefined).sort((a, b) => a.position - b.position);
    const numbers = covered.map((l) => l.position + 1);
    const label = numbers.length > 1 ? `Lessons ${numbers[0]}–${numbers.at(-1)}` : `Lesson ${numbers[0]}`;
    return { ...q, covers: `${label} · ${covered[0]?.title ?? ""}` };
  });
}

export async function getPlacementResult(userId: string, courseId: string) {
  const [row] = await db
    .select({ score: placementResults.score, total: placementResults.total })
    .from(placementResults)
    .where(and(eq(placementResults.userId, userId), eq(placementResults.courseId, courseId)));
  return row ?? null;
}
