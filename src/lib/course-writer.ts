import { nemotronJson, type Nemotron } from "@/lib/ai";
import type { Chapter } from "@/types/youtube";

// Everything here treats model output as untrusted: wrong types, out-of-range times and missing
// fields are dropped or clamped, and an unusable answer throws so the job step retries.

type VideoNotes = { id: string; title: string; durationSeconds: number; notes: string; chapters: Chapter[] };

export type PlannedLesson = { title: string; videoId: string; startSeconds: number; endSeconds: number; summary: string };

export type WrittenLesson = {
  model: Nemotron; // which Nemotron wrote it (a backup if the first choice was overloaded)
  notes: string;
  questions: { prompt: string; options: string[]; answerIndex: number; explanation: string; replaySeconds: number }[];
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const int = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : NaN);
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** "[01:02:05] text" lines → seconds. */
const hhmmss = (s: number) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");

const lineSeconds = (line: string) => {
  const m = /^\[(\d{1,2}):(\d{2}):(\d{2})\]/.exec(line.trim());
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
};

export async function planLessons(courseTitle: string, videos: VideoNotes[]): Promise<{ lessons: PlannedLesson[]; model: Nemotron }> {
  const { json: raw, model } = await nemotronJson(
    "ultra",
    `You design online courses from video lectures. Reply with JSON only:
{"lessons":[{"title":string,"videoId":string,"startSeconds":integer,"endSeconds":integer,"summary":string}]}
Rules:
- Split the material into lessons of about 8–25 minutes, each covering one coherent idea. Follow the video order.
- A lesson never spans two videos. Use the exact videoId given.
- startSeconds/endSeconds are positions in that video, taken from the [HH:MM:SS] timestamps in the notes.
- Leave out intros, outros, sponsor segments and recaps that teach nothing new.
- If the creator's chapters are listed, they are where the creator meant topics to change: start lessons on chapter boundaries, merge chapters shorter than ~5 minutes into a neighbour, and split chapters longer than ~25 minutes.
- title: short and specific (max 60 chars). summary: one sentence on what the learner will be able to do.`,
    `Course: "${courseTitle}"\n\n` +
      videos
        .map((v) => {
          const chapters = v.chapters.length
            ? `Creator's chapters:\n${v.chapters.map((c) => `[${hhmmss(c.startSeconds)}] ${c.title}`).join("\n")}\n\nTranscript:\n`
            : "";
          return `=== VIDEO ${v.id} "${v.title}" (length ${v.durationSeconds}s)\n${chapters}${v.notes}`;
        })
        .join("\n\n"),
    { think: false, maxTokens: 32000 }, // thinking off: ~8s instead of 10–100s, same plan quality in tests
  );

  const byId = new Map(videos.map((v, i) => [v.id, { ...v, order: i }]));
  const lessons = (Array.isArray((raw as { lessons?: unknown }).lessons) ? (raw as { lessons: unknown[] }).lessons : [])
    .map((l) => {
      const o = (l ?? {}) as Record<string, unknown>;
      const video = byId.get(str(o.videoId));
      if (!video) return null;
      // Snap to the creator's chapter starts: the model rounds to transcript timestamps a few seconds off.
      const snap = (t: number) => video.chapters.find((c) => Math.abs(c.startSeconds - t) <= 90)?.startSeconds ?? t;
      const startSeconds = clamp(snap(int(o.startSeconds)), 0, video.durationSeconds);
      const endSeconds = clamp(snap(int(o.endSeconds)), 0, video.durationSeconds);
      const title = str(o.title).slice(0, 80);
      if (!title || !(endSeconds - startSeconds >= 60)) return null;
      return { title, videoId: video.id, startSeconds, endSeconds, summary: str(o.summary), order: video.order };
    })
    .filter((l) => l !== null)
    .sort((a, b) => a.order - b.order || a.startSeconds - b.startSeconds)
    .map(({ title, videoId, startSeconds, endSeconds, summary }) => ({ title, videoId, startSeconds, endSeconds, summary }));

  return { lessons: repairPlan(lessons, videos), model };
}

const MIN_LESSON = 4 * 60;
const GAP = 2 * 60;
const CHUNK = 12 * 60;

/**
 * The model's plan can stop early or leave holes (seen: a 3.5h video planned only to 2h11m) and can
 * make lessons too short. This makes the plan whole without another AI call:
 * - overlaps are trimmed;
 * - any stretch over 2 minutes it skipped becomes lessons from the creator's chapters, or 12-minute parts;
 * - lessons under 4 minutes are merged into the lesson before them (or after, for the first).
 */
export function repairPlan(planned: PlannedLesson[], videos: Pick<VideoNotes, "id" | "title" | "durationSeconds" | "chapters">[]): PlannedLesson[] {
  const out: PlannedLesson[] = [];
  for (const video of videos) {
    const own = planned.filter((l) => l.videoId === video.id).sort((a, b) => a.startSeconds - b.startSeconds);
    const filled: PlannedLesson[] = [];
    let cursor = 0;
    const fill = (from: number, to: number) => {
      if (to - from < GAP) return;
      const marks = video.chapters.filter((c) => c.startSeconds > from && c.startSeconds < to).map((c) => c.startSeconds);
      const cuts = [from, ...(marks.length ? marks : Array.from({ length: Math.floor((to - from) / CHUNK) }, (_, i) => from + (i + 1) * CHUNK).filter((t) => to - t >= MIN_LESSON)), to];
      for (let i = 0; i < cuts.length - 1; i++) {
        const chapter = [...video.chapters].reverse().find((c) => c.startSeconds <= cuts[i]);
        const title = chapter && chapter.startSeconds >= from - 60 ? chapter.title : `${video.title} · part ${filled.length + 1}`;
        filled.push({ title: title.slice(0, 80), videoId: video.id, startSeconds: cuts[i], endSeconds: cuts[i + 1], summary: "" });
      }
    };
    for (const l of own) {
      const start = Math.max(l.startSeconds, cursor);
      if (l.endSeconds - start < 30) continue;
      fill(cursor, start);
      filled.push({ ...l, startSeconds: start });
      cursor = l.endSeconds;
    }
    fill(cursor, video.durationSeconds);
    // A short tail after the last lesson joins it instead of being dropped.
    const last = filled.at(-1);
    if (last && video.durationSeconds - last.endSeconds < GAP) last.endSeconds = video.durationSeconds;

    for (const l of filled) {
      const prev = out.at(-1);
      if (prev && prev.videoId === l.videoId && l.endSeconds - l.startSeconds < MIN_LESSON) prev.endSeconds = l.endSeconds;
      else if (prev && prev.videoId === l.videoId && prev.endSeconds - prev.startSeconds < MIN_LESSON) Object.assign(prev, { endSeconds: l.endSeconds, title: l.title, summary: l.summary || prev.summary });
      else out.push({ ...l });
    }
  }
  if (!out.length) throw new Error("Lesson plan had no usable lessons");
  return out;
}

export async function writeLesson(courseTitle: string, lesson: PlannedLesson, videoNotes: string): Promise<WrittenLesson> {
  // Only the notes inside this lesson (with a little context either side) go to the model.
  const lines = videoNotes.split("\n");
  const inside = lines.filter((line) => {
    const t = lineSeconds(line);
    return t !== null && t >= lesson.startSeconds - 30 && t <= lesson.endSeconds + 30;
  });
  const source = inside.length >= 3 ? inside.join("\n") : videoNotes;

  const { json: raw, model } = await nemotronJson(
    "super",
    `You write one lesson of an online course from notes of a video lecture. Reply with JSON only:
{"notes":string,"questions":[{"prompt":string,"options":[string,string,string,string],"answerIndex":integer,"explanation":string,"replaySeconds":integer}]}
Rules:
- notes: markdown study notes (250–600 words) with ## headings, key terms in **bold**, and any code in fenced blocks. Teach, don't summarise the video.
- 4 or 5 multiple-choice questions that check understanding, not memory of wording. Exactly one correct option; wrong options must be plausible.
- answerIndex is the 0-based index of the correct option.
- explanation: 1–2 sentences on why the answer is right.
- replaySeconds: the moment in the video (seconds) where this is explained, between ${lesson.startSeconds} and ${lesson.endSeconds}. The learner is sent there after a wrong answer.`,
    `Course: "${courseTitle}"\nLesson: "${lesson.title}" (${lesson.startSeconds}s–${lesson.endSeconds}s)\nGoal: ${lesson.summary}\n\nNotes:\n${source}`,
  );

  const o = (raw ?? {}) as Record<string, unknown>;
  const notes = str(o.notes);
  const questions = (Array.isArray(o.questions) ? o.questions : [])
    .map((q) => {
      const x = (q ?? {}) as Record<string, unknown>;
      const options = Array.isArray(x.options) ? x.options.map(str) : [];
      if (options.some((o) => !o)) return null; // dropping one would shift answerIndex onto the wrong option
      const answerIndex = int(x.answerIndex);
      const replay = int(x.replaySeconds);
      if (!str(x.prompt) || options.length < 3 || !(answerIndex >= 0 && answerIndex < options.length)) return null;
      // Models favour putting the right answer at B or C; shuffle so its position gives nothing away.
      const order = options.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      return {
        prompt: str(x.prompt),
        options: order.map((i) => options[i]),
        answerIndex: order.indexOf(answerIndex),
        explanation: str(x.explanation),
        replaySeconds: Number.isNaN(replay) ? lesson.startSeconds : clamp(replay, lesson.startSeconds, lesson.endSeconds),
      };
    })
    .filter((q) => q !== null);

  if (notes.length < 200 || questions.length < 3) throw new Error(`Lesson "${lesson.title}" came back incomplete`);
  return { model, notes, questions };
}
