type Question = { id: string; answerIndex: number; lessonIds: string[] };
type Lesson = { id: string; position: number };

/**
 * Which lessons a learner can skip after the placement test: a lesson is skipped only if every question
 * covering it was answered right ("I don't know this yet" = -1 counts as not known). Lesson 1 never is.
 */
export function gradePlacement(test: Question[], answers: Record<string, number>, lessons: Lesson[]) {
  const known = new Set<string>();
  const unknown = new Set<string>();
  let score = 0;
  for (const q of test) {
    const right = answers[q.id] === q.answerIndex;
    if (right) score++;
    for (const id of q.lessonIds) (right ? known : unknown).add(id);
  }
  const skip = lessons.filter((l) => l.position > 0 && known.has(l.id) && !unknown.has(l.id)).map((l) => l.id);
  return { score, skip };
}
