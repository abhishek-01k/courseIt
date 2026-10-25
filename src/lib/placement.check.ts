// Run: pnpm dlx tsx src/lib/placement.check.ts
import assert from "node:assert/strict";
import { gradePlacement } from "./placement";

const lessons = ["a", "b", "c", "d"].map((id, position) => ({ id, position }));
const test = [
  { id: "q1", answerIndex: 0, lessonIds: ["a", "b"] }, // covers the intro too: it must never be skipped
  { id: "q2", answerIndex: 1, lessonIds: ["c"] },
  { id: "q3", answerIndex: 2, lessonIds: ["c", "d"] },
];

// All right: everything but lesson 1 is skipped.
assert.deepEqual(gradePlacement(test, { q1: 0, q2: 1, q3: 2 }, lessons), { score: 3, skip: ["b", "c", "d"] });
// q3 wrong: c and d stay (c had one right and one wrong answer — not enough).
assert.deepEqual(gradePlacement(test, { q1: 0, q2: 1, q3: 0 }, lessons), { score: 2, skip: ["b"] });
// "I don't know this yet" (-1) and unanswered both keep lessons.
assert.deepEqual(gradePlacement(test, { q1: -1, q2: 1 }, lessons), { score: 1, skip: [] });
console.log("placement checks passed");
