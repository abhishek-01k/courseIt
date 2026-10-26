import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import type { Chapter } from "@/types/youtube";

// --- NextAuth (Drizzle adapter). Sessions stay in a signed cookie, so no sessions table.

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  timezone: text("timezone"), // the learner's IANA zone, so "today" and streaks follow their clock
  minutesPerDay: integer("minutes_per_day").notNull().default(90), // daily learning time (Settings); every course's days are packed from it
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

// --- Shared content: built once per YouTube video or playlist, reused by every learner.

// YouTube API data; refresh anything older than 30 days (YouTube API policy).
export const videos = pgTable("video", {
  id: text("id").primaryKey(), // YouTube video id
  title: text("title").notNull(),
  channel: text("channel").notNull(),
  channelId: text("channel_id"), // filled when the video is fetched (older rows get it on first view)
  durationSeconds: integer("duration_seconds").notNull(),
  thumbnail: text("thumbnail"),
  chapters: jsonb("chapters").$type<Chapter[]>().notNull().default([]),
  fetchedAt: timestamp("fetched_at", { mode: "date" }).notNull().defaultNow(),
});

// The creator behind a video, from the YouTube API; refreshed when older than a day.
export const channels = pgTable("channel", {
  id: text("id").primaryKey(), // YouTube channel id
  title: text("title").notNull(),
  handle: text("handle"), // e.g. "@AndrejKarpathy"
  avatarUrl: text("avatar_url"),
  subscribers: integer("subscribers"), // null when the creator hides it
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const sourceType = pgEnum("source_type", ["video", "playlist"]);
export const courseStatus = pgEnum("course_status", ["queued", "reading", "building", "ready", "failed"]);

export const courses = pgTable(
  "course",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sourceType: sourceType("source_type").notNull(),
    sourceId: text("source_id").notNull().unique(), // video or playlist id
    slug: text("slug").notNull().unique(), // the URL: /courses/<slug>
    title: text("title").notNull(),
    channel: text("channel").notNull(),
    thumbnail: text("thumbnail"),
    durationSeconds: integer("duration_seconds").notNull(),
    status: courseStatus("status").notNull().default("queued"),
    progress: integer("progress").notNull().default(0), // 0–100
    error: text("error"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("course_created_by_idx").on(t.createdBy, t.createdAt)], // daily limit check
);

export const courseVideos = pgTable(
  "course_video",
  {
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    videoId: text("video_id").notNull().references(() => videos.id),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.videoId] })],
);

// What Gemini saw in one stretch of a video: timestamped study notes. Shared by every course that
// includes the video, so a video is only ever read once.
export const videoSegments = pgTable(
  "video_segment",
  {
    videoId: text("video_id").notNull().references(() => videos.id, { onDelete: "cascade" }),
    startSeconds: integer("start_seconds").notNull(),
    endSeconds: integer("end_seconds").notNull(),
    notes: text("notes").notNull(),
    model: text("model").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.videoId, t.startSeconds, t.endSeconds] })],
);

export const lessons = pgTable(
  "lesson",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    videoId: text("video_id").notNull().references(() => videos.id),
    startSeconds: integer("start_seconds").notNull(),
    endSeconds: integer("end_seconds").notNull(),
    summary: text("summary").notNull(),
    notes: text("notes"), // markdown study notes; null until this lesson is built
    ready: boolean("ready").notNull().default(false),
  },
  (t) => [index("lesson_course_idx").on(t.courseId, t.position)],
);

export const questions = pgTable(
  "question",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    answerIndex: integer("answer_index").notNull(),
    explanation: text("explanation").notNull(),
    replaySeconds: integer("replay_seconds").notNull(), // where in the video this is explained
  },
  (t) => [index("question_lesson_idx").on(t.lessonId, t.position)],
);

// The placement test: 10 questions written once per course by Nemotron 3 Ultra from the transcript.
// Each covers 1-3 lessons; answering it right lets a learner skip them.
export const placementQuestions = pgTable(
  "placement_question",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    prompt: text("prompt").notNull(),
    options: jsonb("options").$type<string[]>().notNull(),
    answerIndex: integer("answer_index").notNull(),
    explanation: text("explanation").notNull(),
    lessonIds: jsonb("lesson_ids").$type<string[]>().notNull(), // the lessons this question covers
  },
  (t) => [index("placement_question_course_idx").on(t.courseId, t.position)],
);

// Live log of a course build, shown to the learner as "what's happening now" plus every step so far.
export const stepStatus = pgEnum("step_status", ["running", "done", "failed"]);

export const courseSteps = pgTable(
  "course_step",
  {
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // stable per step, e.g. "plan" or "lesson:<id>", so retries update the same row
    label: text("label").notNull(),
    detail: text("detail"),
    status: stepStatus("status").notNull().default("running"),
    startedAt: timestamp("started_at", { mode: "date" }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { mode: "date" }),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.key] })],
);

// --- Per learner.

// One row per day the learner opened CourseIt (their timezone). Visiting is what keeps the streak.
export const userDays = pgTable(
  "user_day",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    day: text("day").notNull(), // YYYY-MM-DD in the learner's timezone
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

// Every answer a learner gives. Latest per question is what the quiz shows; the rest is history.
export const attempts = pgTable(
  "attempt",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    chosenIndex: integer("chosen_index").notNull(),
    correct: boolean("correct").notNull(),
    day: text("day").notNull(), // YYYY-MM-DD in the learner's timezone, for streaks
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("attempt_user_lesson_idx").on(t.userId, t.lessonId), index("attempt_user_day_idx").on(t.userId, t.day)],
);

// A lesson counts as done once every quiz question has been answered.
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    score: integer("score").notNull(), // right on the first try
    total: integer("total").notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] }), index("lesson_progress_user_course_idx").on(t.userId, t.courseId)],
);

// Real watch time per lesson: unique seconds seen (skipping ahead doesn't count). Watched at 80%.
export const lessonWatch = pgTable(
  "lesson_watch",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    seconds: integer("seconds").array().notNull().default([]), // which seconds of the lesson were seen, across every session
    watchedSeconds: integer("watched_seconds").notNull().default(0), // = how many of them
    watchedAt: timestamp("watched_at", { mode: "date" }), // set once watchedSeconds reaches 80% of the lesson
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] }), index("lesson_watch_user_course_idx").on(t.userId, t.courseId)],
);

// The learner's own notes on a lesson.
export const lessonNotes = pgTable(
  "lesson_note",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] }), index("lesson_note_user_idx").on(t.userId, t.updatedAt)],
);

// A learner's placement test answers (questionId -> option, -1 = "I don't know this yet"). Retakes replace it.
export const placementResults = pgTable(
  "placement_result",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    answers: jsonb("answers").$type<Record<string, number>>().notNull(),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.courseId] })],
);

// Lessons a learner skips because they already know them. Taken out of their day plan; still openable.
export const lessonSkips = pgTable(
  "lesson_skip",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] }), index("lesson_skip_user_course_idx").on(t.userId, t.courseId)],
);

export const enrollments = pgTable(
  "enrollment",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    lastOpenedAt: timestamp("last_opened_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.courseId] })],
);

// A learner's own set of courses from different creators, in stages. Private until published to Community.
export const roadmaps = pgTable(
  "roadmap",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(), // the URL: /roadmaps/<slug>
    ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("roadmap_owner_idx").on(t.ownerId, t.updatedAt), index("roadmap_published_idx").on(t.published, t.updatedAt)],
);

export const roadmapStages = pgTable(
  "roadmap_stage",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    roadmapId: text("roadmap_id").notNull().references(() => roadmaps.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    name: text("name").notNull(),
  },
  (t) => [index("roadmap_stage_roadmap_idx").on(t.roadmapId, t.position)],
);

// A course sits in at most one stage of a roadmap.
export const roadmapCourses = pgTable(
  "roadmap_course",
  {
    roadmapId: text("roadmap_id").notNull().references(() => roadmaps.id, { onDelete: "cascade" }),
    stageId: text("stage_id").notNull().references(() => roadmapStages.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    addedAt: timestamp("added_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.roadmapId, t.courseId] }), index("roadmap_course_stage_idx").on(t.stageId, t.position)],
);

// A learner following someone else's published roadmap: it shows under "Following" and stays in sync.
export const roadmapFollows = pgTable(
  "roadmap_follow",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    roadmapId: text("roadmap_id").notNull().references(() => roadmaps.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roadmapId] }), index("roadmap_follow_roadmap_idx").on(t.roadmapId, t.createdAt)],
);

export const coursesRelations = relations(courses, ({ many }) => ({ videos: many(courseVideos), lessons: many(lessons) }));
export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  questions: many(questions),
}));
export const questionsRelations = relations(questions, ({ one }) => ({
  lesson: one(lessons, { fields: [questions.lessonId], references: [lessons.id] }),
}));
export const courseVideosRelations = relations(courseVideos, ({ one }) => ({
  course: one(courses, { fields: [courseVideos.courseId], references: [courses.id] }),
  video: one(videos, { fields: [courseVideos.videoId], references: [videos.id] }),
}));
