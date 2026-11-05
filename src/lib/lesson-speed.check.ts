// Run: pnpm dlx tsx src/lib/lesson-speed.check.ts [lessons] [off] [repeat] [parallel] [super|lightning|ultra]
// Benchmarks lesson writing on real lessons from the database in DATABASE_URL (use a dev database, never
// production): the same lessons written with thinking ON and OFF, with time, tokens, cost, model and output size.
// Fails if the default setting (thinking OFF) uses more than half of the 120s per-call timeout, falls back to a
// backup model, or comes back incomplete. Run it before changing the lesson model, prompt or settings.
// Costs a few cents of Nebius per run (2 × lessons calls).
import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";
import { writeLesson, type WrittenLesson } from "./course-writer";

process.loadEnvFile(".env.local");
const sql = neon(process.env.DATABASE_URL!);
const count = Number(process.argv[2] ?? 3);
// "off" measures only the default (thinking OFF), "repeat" times each lesson: for checking how often the model stalls.
const offOnly = process.argv[3] === "off";
const repeat = Number(process.argv[4] ?? 1);
// At most this many lessons written at the same moment (Nebius slows sharply with many parallel requests).
const parallel = Number(process.argv[5] ?? Infinity);
// Which model writes the lessons (default: the one the app uses). Prices per 1M tokens, Nebius /v1/models, 5 Nov 2026.
const writer = (process.argv[6] ?? "super") as "super" | "lightning" | "ultra";
const PRICES = { super: { input: 0.3, output: 0.9 }, lightning: { input: 0.06, output: 0.24 }, ultra: { input: 1, output: 3 } };

const PRICE = PRICES[writer];
// "strict" runs the old strict-schema mode, to compare against the default plain JSON mode.
const strictMode = process.argv[7] === "strict";
const TIMEOUT_S = 120; // per-call limit in nemotronJson (src/lib/ai.ts)

const lessons = await sql`
  select l.title, l.video_id as "videoId", l.start_seconds as "startSeconds", l.end_seconds as "endSeconds", l.summary, c.title as course
  from lesson l join course c on c.id = l.course_id where l.ready order by l.position limit ${count}`;
assert(lessons.length, "No ready lessons in this database: build a course first.");

const notesFor = async (videoId: string) =>
  (await sql`select notes from video_segment where video_id = ${videoId} order by start_seconds`).map((r) => r.notes as string).join("\n");

type Row = { think: boolean; lesson: string; seconds: number; ok: boolean; model?: string; input?: number; output?: number; cost?: number; words?: number; lines?: number; questions?: number; error?: string };

async function run(think: boolean, l: Record<string, unknown>): Promise<Row> {
  const started = Date.now();
  try {
    const w: WrittenLesson = await writeLesson(l.course as string, l as never, await notesFor(l.videoId as string), { think, model: writer, strict: strictMode });
    const cost = (w.usage.input * PRICE.input + w.usage.output * PRICE.output) / 1e6;
    return { think, lesson: (l.title as string).slice(0, 40), seconds: (Date.now() - started) / 1000, ok: true, model: w.model, input: w.usage.input, output: w.usage.output, cost, words: w.notes.split(/\s+/).length, lines: w.notes.split("\n").length, questions: w.questions.length };
  } catch (error) {
    return { think, lesson: (l.title as string).slice(0, 40), seconds: (Date.now() - started) / 1000, ok: false, error: (error as Error).message.slice(0, 120) };
  }
}

const jobs = lessons.flatMap((l) => Array.from({ length: repeat }, () => (offOnly ? [() => run(false, l)] : [() => run(false, l), () => run(true, l)])).flat());
const rows: Row[] = [];
let next = 0;
const worker = async () => {
  while (next < jobs.length) rows.push(await jobs[next++]());
};
const runStarted = Date.now();
await Promise.all(Array.from({ length: Math.min(parallel, jobs.length) }, worker));
console.log(`${jobs.length} lessons, at most ${Math.min(parallel, jobs.length)} at a time: ${Math.round((Date.now() - runStarted) / 1000)}s in total`);
console.table(rows.map((r) => ({ ...r, seconds: Math.round(r.seconds), cost: r.cost === undefined ? undefined : `$${r.cost.toFixed(4)}` })));

for (const think of [false, true]) {
  const mine = rows.filter((r) => r.think === think && r.ok);
  const avg = (k: "seconds" | "cost" | "output" | "words" | "lines") => mine.reduce((t, r) => t + (r[k] ?? 0), 0) / Math.max(mine.length, 1);
  console.log(`thinking ${think ? "ON " : "OFF"}: ${mine.length}/${lessons.length} ok · avg ${avg("seconds").toFixed(0)}s · max ${Math.max(...mine.map((r) => r.seconds)).toFixed(0)}s · avg ${avg("output").toFixed(0)} output tokens · $${avg("cost").toFixed(4)}/lesson · ${avg("words").toFixed(0)} words · ${avg("lines").toFixed(0)} lines`);
}

// The default (thinking OFF) must be fast, on the main model, and complete.
const off = rows.filter((r) => !r.think);
assert(off.every((r) => r.ok), "Thinking OFF: a lesson failed");
assert(off.every((r) => r.model === writer), "Thinking OFF: a lesson fell back to a backup model");
assert(off.every((r) => r.seconds < TIMEOUT_S / 2), `Thinking OFF: a lesson took more than half the ${TIMEOUT_S}s timeout`);
console.log("lesson speed: ok");
