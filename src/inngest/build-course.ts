import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { courses, courseSteps, courseVideos, lessons, placementQuestions, questions, videos, videoSegments } from "@/db/schema";
import { readVideoSegment } from "@/lib/ai";
import { AI } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";
import { planLessons, writeLesson, writePlacementTest } from "@/lib/course-writer";
import { fetchTranscript } from "@/lib/transcript";
import { BUILD_COURSE, inngest } from "./client";

// Progress: reading the videos is 10–50%, planning 60%, lessons fill 60–100%.
const setCourse = (courseId: string, values: PgUpdateSetSource<typeof courses>) =>
  db.update(courses).set(values).where(eq(courses.id, courseId));

async function loadVideos(courseId: string) {
  return db
    .select({ id: videos.id, title: videos.title, durationSeconds: videos.durationSeconds, chapters: videos.chapters })
    .from(courseVideos)
    .innerJoin(videos, eq(videos.id, courseVideos.videoId))
    .where(eq(courseVideos.courseId, courseId))
    .orderBy(asc(courseVideos.position));
}

/**
 * Runs one piece of work and records it in the course's live build log: "running" when it starts,
 * then "done" with a short result, or "failed". The key is stable, so a retry updates the same row.
 */
async function track<T>(courseId: string, key: string, label: string, work: () => Promise<T>, result?: (value: T) => string | null) {
  const row = { courseId, key, label, detail: null, status: "running" as const, startedAt: new Date(), finishedAt: null };
  
  console.log("[track] courseId:", courseId);
  console.log("[track] row:", row);

  await db.insert(courseSteps).values(row).onConflictDoUpdate({ target: [courseSteps.courseId, courseSteps.key], set: row });
  const where = and(eq(courseSteps.courseId, courseId), eq(courseSteps.key, key));
  try {
    const value = await work();
    await db.update(courseSteps).set({ status: "done", detail: result?.(value) ?? null, finishedAt: new Date() }).where(where);
    return value;
  } catch (error) {
    await db.update(courseSteps).set({ status: "failed", detail: "Retrying…", finishedAt: new Date() }).where(where);
    throw error;
  }
}

const words = (text: string) => text.split(/\s+/).filter(Boolean).length.toLocaleString("en-US");

async function notesFor(videoId: string) {
  const parts = await db.select({ notes: videoSegments.notes }).from(videoSegments).where(eq(videoSegments.videoId, videoId)).orderBy(asc(videoSegments.startSeconds));
  return parts.map((p) => p.notes).join("\n");
}

// Each step.run is retried on its own and its result is saved, so a crash or redeploy resumes here.
// Steps write to the database and return small values, keeping the job's saved state tiny.
export const buildCourse = inngest.createFunction(
  {
    id: "build-course",
    triggers: [{ event: BUILD_COURSE }],
    retries: 4, // with Inngest's growing backoff, on top of the busy-retries and backup models in nemotronJson
    // A new request for the same course replaces the old build. (No concurrency limit here: in Inngest it
    // caps steps, not runs, and would write the lessons one at a time instead of in parallel.)
    cancelOn: [{ event: BUILD_COURSE, match: "data.courseId" }],
    onFailure: async ({ event, error }) => {
      await setCourse(event.data.event.data.courseId, { status: "failed", error: error.message.slice(0, 500) });
    },
  },
  async ({ event, step }) => {
    
    console.log("[buildCourse] Full event:", JSON.stringify(event, null, 2));
    console.log("[buildCourse] Event data:", event.data);

    // resume: keep the plan and the lessons already written; only write what's missing.
    const { courseId, resume = false } = event.data as { courseId: string; resume?: boolean };

    console.log("[buildCourse] Extracted courseId:", courseId);

    if (typeof courseId !== "string" || !courseId.trim()) {
      throw new Error(
        `Missing courseId in Inngest event: ${JSON.stringify(event.data)}`
      );
    }

    // Captions first: one Supadata call per video, all at once, seconds at any length. Videos with no
    // captions are split into pieces for Gemini to watch. Anything already read for another course is reused.
    const pieces = await step.run("fetch transcripts", async () => {
      if (!resume) await db.delete(courseSteps).where(eq(courseSteps.courseId, courseId));
      await setCourse(courseId, { status: "reading", progress: 10, error: null });
      const list = await loadVideos(courseId);
      // Only a full transcript counts as done; a video Gemini read part of still tries captions first.
      const done = new Set(
        (
          await db
            .select({ id: videoSegments.videoId })
            .from(videoSegments)
            .where(and(inArray(videoSegments.videoId, list.map((v) => v.id)), eq(videoSegments.model, "supadata")))
        ).map((r) => r.id),
      );
      const missing = await Promise.all(
        list.map((v) =>
          done.has(v.id)
            ? track(courseId, `transcript:${v.id}`, `Using the saved transcript of “${v.title}”`, async () => null, () => "Read before for another course")
            : track(
                courseId,
                `transcript:${v.id}`,
                `Fetching the transcript of “${v.title}”`,
                async () => {
                  const transcript = await fetchTranscript(v.id);
                  if (!transcript) return { video: v, transcript: null };
                  await db.batch([
                    db.delete(videoSegments).where(eq(videoSegments.videoId, v.id)), // drop partial Gemini notes
                    db.insert(videoSegments).values({ videoId: v.id, startSeconds: 0, endSeconds: v.durationSeconds, notes: transcript, model: "supadata" }),
                  ]);
                  return { video: v, transcript };
                },
                (r) => (r.transcript ? `${words(r.transcript)} words · ${formatDuration(v.durationSeconds)} of video` : "No captions, so Gemini will watch it"),
              ).then((r) => (r.transcript ? null : r.video)),
        ),
      );
      return missing
        .filter((v) => v !== null)
        .flatMap((v) => {
          const out = [];
          for (let start = 0; start < v.durationSeconds; start += AI.segmentSeconds) {
            out.push({ video: { id: v.id, title: v.title }, start, end: Math.min(start + AI.segmentSeconds, v.durationSeconds) });
          }
          return out;
        });
    });

    // Fallback: Gemini watches every captionless piece in parallel.
    await Promise.all(
      pieces.map(({ video, start, end }) =>
        step.run(`read ${video.id} ${start}-${end}`, () =>
          track(courseId, `watch:${video.id}:${start}`, `Watching ${formatDuration(start)}–${formatDuration(end)} of “${video.title}” with Gemini`, async () => {
            const key = and(eq(videoSegments.videoId, video.id), eq(videoSegments.startSeconds, start), eq(videoSegments.endSeconds, end));
            const [cached] = await db.select({ videoId: videoSegments.videoId }).from(videoSegments).where(key);
            if (!cached) {
              const notes = await readVideoSegment(video, start, end);
              await db.insert(videoSegments).values({ videoId: video.id, startSeconds: start, endSeconds: end, notes, model: AI.readerModel }).onConflictDoNothing();
            }
            await setCourse(courseId, {
              progress: sql`10 + 40 * (select count(*) from ${videoSegments} where ${videoSegments.model} <> 'supadata' and ${videoSegments.videoId} in (select ${courseVideos.videoId} from ${courseVideos} where ${courseVideos.courseId} = ${courseId})) / ${pieces.length}`,
            });
          }),
        ).catch(() => null), // a piece that never reads is skipped; the plan is built from what was read
      ),
    );

    const { ids: lessonIds } = await step.run("plan lessons", () =>
      track(
        courseId,
        "plan",
        "Planning the lessons with Nemotron 3 Ultra",
        async () => {
          await setCourse(courseId, { status: "building", progress: 50 });
          // Existing lessons are never replaced: answers, watch time and notes of every learner hang off them.
          const kept = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.position));
          if (kept.length) return { ids: kept.map((l) => l.id), model: null };
          const [course] = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, courseId));
          const list = await loadVideos(courseId);
          const withNotes = await Promise.all(list.map(async (v) => ({ ...v, notes: await notesFor(v.id) })));
          const plan = await planLessons(course.title, withNotes);

          const rows = plan.lessons.map((l, position) => ({ ...l, id: crypto.randomUUID(), courseId, position }));
          await db.batch([db.insert(lessons).values(rows), setCourse(courseId, { progress: 60 })]);
          return { ids: rows.map((r) => r.id), model: plan.model };
        },
        (r) => (r.model ? `${r.ids.length} lessons · planned by ${AI.modelNames[r.model]}` : `Kept the existing ${r.ids.length} lessons`),
      ),
    );

    const build = (lessonId: string) =>
      step.run(`write lesson ${lessonId}`, async () => {
        const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
        if (lesson.ready) return;
        await track(
          courseId,
          `lesson:${lessonId}`,
          `Writing lesson ${lesson.position + 1}: ${lesson.title}`,
          async () => {
            const [course] = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, courseId));
            const written = await writeLesson(course.title, lesson, await notesFor(lesson.videoId));
            await db.batch([
              db.delete(questions).where(eq(questions.lessonId, lessonId)),
              db.insert(questions).values(written.questions.map((q, position) => ({ ...q, lessonId, position }))),
              db.update(lessons).set({ notes: written.notes, ready: true }).where(eq(lessons.id, lessonId)),
              // 60–100% by share of ready lessons; counted in SQL so parallel steps can't overwrite each other.
              db
                .update(courses)
                .set({
                  progress: sql`60 + 40 * (select count(*) from ${lessons} where ${lessons.courseId} = ${courseId} and ${lessons.ready}) / ${lessonIds.length}`,
                })
                .where(eq(courses.id, courseId)),
            ]);
            return written;
          },
          (w) => `${AI.modelNames[w.model]} · ${words(w.notes)} words of notes · ${w.questions.length} quiz questions`,
        );
      });

    // A lesson that still fails after every retry and backup model doesn't sink the course: the rest stay
    // usable and the learner can retry just the missing ones.
    const buildOrSkip = (lessonId: string) =>
      build(lessonId).catch(() =>
        step.run(`give up on lesson ${lessonId}`, () =>
          db
            .update(courseSteps)
            .set({ detail: "Couldn't write this lesson right now. Use Retry to try again." })
            .where(and(eq(courseSteps.courseId, courseId), eq(courseSteps.key, `lesson:${lessonId}`))),
        ),
      );

    // The placement test is written alongside the lessons (from the transcript, not the notes), so it's
    // ready seconds after the plan. If it fails, the course still works; the test just isn't offered.
    const placement = step
      .run("write placement test", () =>
        track(
          courseId,
          "placement",
          "Writing your placement test with Nemotron 3 Ultra",
          async () => {
            const [{ existing }] = await db.select({ existing: count() }).from(placementQuestions).where(eq(placementQuestions.courseId, courseId));
            if (existing) return existing;
            const [course] = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, courseId));
            const list = await db
              .select({ id: lessons.id, position: lessons.position, title: lessons.title, startSeconds: lessons.startSeconds, endSeconds: lessons.endSeconds, videoId: lessons.videoId })
              .from(lessons)
              .where(eq(lessons.courseId, courseId))
              .orderBy(asc(lessons.position));
            const notes = new Map(await Promise.all([...new Set(list.map((l) => l.videoId))].map(async (id) => [id, await notesFor(id)] as const)));
            const test = await writePlacementTest(course.title, list, notes);
            if (test.length) await db.insert(placementQuestions).values(test.map((q, position) => ({ ...q, courseId, position })));
            return test.length;
          },
          (n) => `${n} questions, each covering 1–3 lessons`,
        ),
      )
      .catch(() => null);

    // Lesson 1 first so the learner can start while the rest are written in parallel.
    const [first, ...rest] = lessonIds;
    const writeLessons = async () => {
      await buildOrSkip(first);
      await Promise.all(rest.map(buildOrSkip));
    };
    await Promise.all([placement, writeLessons()]);

    await step.run("finish", async () => {
      const [{ notReady }] = await db.select({ notReady: count() }).from(lessons).where(and(eq(lessons.courseId, courseId), eq(lessons.ready, false)));
      const error = notReady ? `${notReady} ${notReady === 1 ? "lesson" : "lessons"} couldn't be written yet.` : null;
      await track(
        courseId,
        "finish",
        notReady ? "Course ready, with some lessons missing" : "Course ready",
        () => setCourse(courseId, { status: "ready", progress: 100, error }),
        () => error,
      );
    });
  },
);
