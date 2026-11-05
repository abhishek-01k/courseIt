import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { courses, courseSteps, courseVideos, lessons, placementQuestions, questions, videos, videoSegments } from "@/db/schema";
import { canRetry, usageFor } from "@/lib/billing";
import { buildsPaused, NO_CAPTIONS_ERROR, noCaptions, PAUSED_BUILD_ERROR } from "@/lib/builds-paused";
import { AI } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";
import { planLessons, writeLesson, writePlacementTest } from "@/lib/course-writer";
import { fetchTranscript } from "@/lib/transcript";
import { NonRetriableError } from "inngest";
import { BUILD_COURSE, inngest } from "./client";
import { queueEmail } from "./send-email";

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

/**
 * Only the transcript lines inside one lesson's window, filtered in the database. A lesson used to download its
 * whole video's transcript and keep a few minutes of it (lesson after lesson, retry after retry), which was most of
 * the Neon network transfer. Same rule as writeLesson in course-writer.ts: lines whose "[HH:MM:SS]" falls within the
 * window. Returns null below 3 lines, where writeLesson would use the whole transcript, so the caller fetches it.
 * The patterns avoid backslashes: "[[]" and "[]]" are a literal "[" and "]", chr(10) is a newline.
 */
async function sliceFor(videoId: string, from: number, to: number) {
  const { rows } = await db.execute(sql`
    select string_agg(x.line, chr(10) order by x.seg, x.n) as notes, count(*)::int as lines
    from (
      select s.start_seconds as seg, t.n, t.line,
        substring(btrim(t.line) from '^[[]([0-9]{1,2}):[0-9]{2}:[0-9]{2}[]]')::int * 3600
          + substring(btrim(t.line) from '^[[][0-9]{1,2}:([0-9]{2}):[0-9]{2}[]]')::int * 60
          + substring(btrim(t.line) from '^[[][0-9]{1,2}:[0-9]{2}:([0-9]{2})[]]')::int as secs
      from ${videoSegments} s, regexp_split_to_table(s.notes, chr(10)) with ordinality as t(line, n)
      where s.video_id = ${videoId}
    ) x
    where x.secs between ${from} and ${to}`);
  const [row] = rows as { notes: string | null; lines: number }[];
  return row && row.lines >= 3 ? row.notes : null;
}

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
    // Paid builds first when the queue is busy: a Max build runs ahead of anything queued in the last 5 minutes,
    // a Pro build ahead of the last 3. Free (and events without a plan) wait their turn. Set in src/lib/billing.ts.
    priority: { run: "event.data.plan == 'max' ? 300 : event.data.plan == 'pro' ? 180 : 0" },
    onFailure: async ({ event, error }) => {
      const courseId = event.data.event.data.courseId;
      await setCourse(courseId, { status: "failed", error: error.message.slice(0, 500) });
      // Tell whoever started it (once per course): Retry on Pro and Max, an upgrade link on Free.
      const [course] = await db.select({ title: courses.title, slug: courses.slug, createdBy: courses.createdBy }).from(courses).where(eq(courses.id, courseId));
      // No captions: the course page says so, and an email offering Retry would be wrong.
      if (course?.createdBy && !noCaptions(error.message)) {
        const retry = canRetry(await usageFor(course.createdBy));
        await queueEmail("buildStopped", course.createdBy, `build-stopped:${courseId}`, { title: course.title, slug: course.slug, canRetry: retry });
      }
    },
  },
  async ({ event, step }) => {

    // resume: keep the plan and the lessons already written; only write what's missing.
    const { courseId, resume = false, plan } = event.data as { courseId: string; resume?: boolean; plan?: string };
    // Who writes the lessons. Pro and Max (and admins, sent as "max"): Nemotron 3 Ultra, the most reliable in benchmarks
    // (8/8 real lessons, avg 6s, $0.0063 each, 5 Nov 2026), with Lightning then Super as backups (Super last while it's slow). Free: Lightning, fast
    // and cheap (7/8, avg 7s, $0.0004 each, ~400 words), with Ultra for the odd lesson Lightning can't write. Free used
    // to get Super, but Nebius served Nemotron 3.5 Super at 5–8 tokens/s on 5 Nov (others: 140–230), so Free lessons
    // took minutes and most failed. Measured with src/lib/lesson-speed.check.ts.
    const paid = plan === "pro" || plan === "max";
    const writer = paid ? ({ model: "ultra", fallbacks: ["lightning", "super"] } as const) : ({ model: "lightning", fallbacks: ["ultra"] } as const);

    if (typeof courseId !== "string" || !courseId.trim()) {
      throw new Error(
        `Missing courseId in Inngest event: ${JSON.stringify(event.data)}`
      );
    }

    // Paused: stop before any paid call. This runs again before every step, so a build already under way
    // stops at its next step. Marked failed so the course page offers Retry, which resumes it once unpaused.
    if (buildsPaused()) {
      await setCourse(courseId, { status: "failed", error: PAUSED_BUILD_ERROR });
      return;
    }

    // Courses are built from captions only (one Supadata call per video, seconds at any length). New courses are
    // checked for captions before they start (src/modules/course/start.ts), so this mostly reuses saved transcripts.
    // A video with no captions is skipped; with none at all, the build stops instead of writing empty lessons.
    const readable = await step.run("fetch transcripts", async () => {
      if (!resume) await db.delete(courseSteps).where(eq(courseSteps.courseId, courseId));
      await setCourse(courseId, { status: "reading", progress: 10, error: null });
      const list = await loadVideos(courseId);
      // Any saved notes count, including ones the old Gemini reader wrote for courses built before captions-only.
      const saved = new Set(
        (await db.select({ id: videoSegments.videoId }).from(videoSegments).where(inArray(videoSegments.videoId, list.map((v) => v.id)))).map((r) => r.id),
      );
      const found = await Promise.all(
        list.map((v) =>
          saved.has(v.id)
            ? track(courseId, `transcript:${v.id}`, `Using the saved transcript of “${v.title}”`, async () => "saved", () => "Read before for another course")
            : track(
                courseId,
                `transcript:${v.id}`,
                `Fetching the transcript of “${v.title}”`,
                async () => {
                  const transcript = await fetchTranscript(v.id);
                  if (!transcript) return null;
                  await db.insert(videoSegments).values({ videoId: v.id, startSeconds: 0, endSeconds: v.durationSeconds, notes: transcript, model: "supadata" }).onConflictDoNothing();
                  return words(transcript);
                },
                (w) => (w ? `${w} words · ${formatDuration(v.durationSeconds)} of video` : "No captions, so this video is skipped"),
              ),
        ),
      );
      return found.filter(Boolean).length;
    });
    if (!readable) throw new NonRetriableError(NO_CAPTIONS_ERROR);

    // Existing lessons are never replaced: answers, watch time and notes of every learner hang off them.
    const kept = await step.run("existing lessons", async () => {
      await setCourse(courseId, { status: "building", progress: 50 });
      const rows = await db.select({ id: lessons.id }).from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.position));
      return rows.map((l) => l.id);
    });

    let lessonIds = kept;
    if (!kept.length) {
      const [{ title }, list] = await step.run("course videos", async () => {
        const [course] = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, courseId));
        const all = await loadVideos(courseId);
        const withNotes = new Set(
          (await db.select({ id: videoSegments.videoId }).from(videoSegments).where(inArray(videoSegments.videoId, all.map((v) => v.id)))).map((r) => r.id),
        );
        return [course, all.filter((v) => withNotes.has(v.id))] as const;
      });
      // Each video of a playlist is planned on its own, in parallel: small prompts, no single huge call
      // that can stop early or time out, and one slow video doesn't hold up the rest.
      const plans = await Promise.all(
        list.map((video, i) =>
          step.run(`plan ${video.id}`, () =>
            track(
              courseId,
              list.length > 1 ? `plan:${video.id}` : "plan",
              list.length > 1 ? `Planning video ${i + 1} of ${list.length}: ${video.title}` : "Planning the lessons with Nemotron 3 Ultra",
              async () => planLessons(title, [{ ...video, notes: await notesFor(video.id) }]),
              (plan) => `${plan.lessons.length} lessons · planned by ${AI.modelNames[plan.model]}`,
            ),
          ),
        ),
      );
      lessonIds = await step.run("save the plan", async () => {
        const rows = plans.flatMap((p) => p.lessons).map((l, position) => ({ ...l, id: crypto.randomUUID(), courseId, position }));
        await db.batch([db.insert(lessons).values(rows), setCourse(courseId, { progress: 60 })]);
        return rows.map((r) => r.id);
      });
    }

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
            // Further reading (Tavily) is no longer searched here: learners ask for it from the lesson page, so credits
            // are spent only on lessons someone reads, and never twice when a step retries.
            const written = await writeLesson(
              course.title,
              lesson,
              (await sliceFor(lesson.videoId, lesson.startSeconds - 30, lesson.endSeconds + 30)) ?? (await notesFor(lesson.videoId)),
              { model: writer.model, fallbacks: [...writer.fallbacks] },
            );
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
      // Builds take minutes, so most people have left the page: email whoever started it (once per course).
      const [course] = await db.select({ title: courses.title, slug: courses.slug, createdBy: courses.createdBy }).from(courses).where(eq(courses.id, courseId));
      const [{ total }] = await db.select({ total: count() }).from(lessons).where(eq(lessons.courseId, courseId));
      if (course?.createdBy) {
        await queueEmail("courseReady", course.createdBy, `course-ready:${courseId}`, { title: course.title, slug: course.slug, lessons: total, missing: notReady });
      }
    });
  },
);
