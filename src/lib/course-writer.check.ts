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
assert.equal(tiny.length, 2);
assert.deepEqual([tiny[0].startSeconds, tiny[0].endSeconds], [0, 1000]);

// No chapters: a skipped stretch becomes 12-minute parts; overlaps are trimmed.
const plain = repairPlan([l(0, 700), l(600, 1200)], [{ ...v, chapters: [] }]);
assert.deepEqual([plain[1].startSeconds, plain[1].endSeconds], [700, 1200]);
assert.equal(plain.at(-1)!.endSeconds, 3600);
assert.ok(plain.every((x) => x.endSeconds - x.startSeconds >= 240));
console.log("plan repair checks passed");
