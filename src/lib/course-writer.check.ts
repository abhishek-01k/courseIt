// Run: pnpm dlx tsx src/lib/course-writer.check.ts
import assert from "node:assert/strict";
import { repairPlan } from "./course-writer";

const v = { id: "v", title: "Video", durationSeconds: 3600, chapters: [{ title: "Intro", startSeconds: 0 }, { title: "Middle", startSeconds: 1800 }, { title: "End", startSeconds: 3000 }] };
const l = (s: number, e: number, title = "L") => ({ title, videoId: "v", startSeconds: s, endSeconds: e, summary: "x" });

// The model stopped at 20:00 of a 60-minute video: the rest is filled from the creator's chapters.
const stopped = repairPlan([l(0, 600), l(600, 1200)], [v]);
assert.equal(stopped.at(-1)!.endSeconds, 3600);
assert.ok(stopped.some((x) => x.title === "Middle" && x.startSeconds === 1800));
assert.ok(stopped.some((x) => x.title === "End" && x.startSeconds === 3000));

// Lessons under 4 minutes merge into the one before.
const tiny = repairPlan([l(0, 900), l(900, 1000), l(1000, 3600)], [v]);
assert.deepEqual([tiny[0].startSeconds, tiny[0].endSeconds], [0, 1000]); // the 100s lesson joined the one before
assert.ok(tiny.every((x) => x.endSeconds - x.startSeconds >= 240));

// No chapters: a skipped stretch becomes 12-minute parts; overlaps are trimmed.
const plain = repairPlan([l(0, 700), l(600, 1200)], [{ ...v, chapters: [] }]);
assert.deepEqual([plain[1].startSeconds, plain[1].endSeconds], [700, 1200]);
assert.equal(plain.at(-1)!.endSeconds, 3600);
assert.ok(plain.every((x) => x.endSeconds - x.startSeconds >= 240));
// The model made one 1h48m "lesson" out of a 1h56m video (Let's build GPT): split into ≤30-minute parts.
const gpt = { id: "v", title: "GPT", durationSeconds: 6980, chapters: [] };
const long = repairPlan([l(0, 472, "Intro"), l(472, 6980, "Data")], [gpt]);
assert.ok(long.every((x) => x.endSeconds - x.startSeconds <= 30 * 60), "no lesson over 30 minutes");
assert.ok(long.length >= 10);
assert.equal(long.at(-1)!.endSeconds, 6980);
assert.ok(long.every((x, i) => i === 0 || x.startSeconds === long[i - 1].endSeconds), "contiguous");
// With chapters inside, the split follows them (and keeps the model's title for the first piece).
const chaptered = repairPlan([l(0, 3600, "All of it")], [v]);
assert.deepEqual(chaptered.map((x) => [x.title, x.startSeconds]), [["All of it", 0], ["Middle", 1800], ["End", 3000]]);

console.log("plan repair checks passed");
