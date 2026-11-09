import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, courseVideos, lessons, videoSegments } from "@/db/schema";
import { nemotronJson, type Schema } from "@/lib/ai";
import { COURSE_LANGUAGES, COURSE_TAGS, isCourseLanguage, isCourseTag } from "@/lib/course-tags";

const SCHEMA: Schema = {
  type: "object",
  additionalProperties: false,
  required: ["tags", "language"],
  properties: {
    tags: { type: "array", items: { type: "string", enum: COURSE_TAGS.map((t) => t.id) }, minItems: 1, maxItems: 3 },
    language: { type: "string", enum: COURSE_LANGUAGES.map((l) => l.id) },
  },
};

const SYSTEM = `You file online courses into topics so learners can browse them. Reply with JSON only: {"tags":[...],"language":"..."}.
tags: 1 to 3 ids from the list, most relevant first. Usually 1 or 2: add a tag only if a learner browsing that topic would want this course. A language tutorial is "programming" alone, even if it mentions the web or AI.
${COURSE_TAGS.map((t) => `- ${t.id}: ${t.label}`).join("\n")}
"school" is Class 1-12 and board exams. "entrance" is competitive exams such as JEE, NEET, UPSC, GATE and SSC. "college" is university subjects outside computing, such as pharmacy or commerce papers. "cs" is computer science theory such as DSA, DBMS, operating systems, networks and system design; neural networks and LLMs are "ai-data" only. "design" is visual, UI and graphic design, never software design. "languages" is human languages such as English or IELTS, never programming languages. Add the subject too when it fits (a Class 10 maths course is school and maths). Use "other" only when nothing else fits, and then alone.
language: the language the teacher speaks, judged from the caption sample. Hindi written in English letters (Hinglish) is "hindi".`;

/** Reads a course, asks the cheap model for its topics and language, and saves them. Throws if the model can't answer. */
export async function tagCourse(courseId: string) {
  const [course] = await db.select({ title: courses.title, channel: courses.channel }).from(courses).where(eq(courses.id, courseId));
  if (!course) return null;
  const [titles, [caption]] = await Promise.all([
    db.select({ title: lessons.title }).from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.position)).limit(30),
    db
      .select({ notes: videoSegments.notes })
      .from(courseVideos)
      .innerJoin(videoSegments, eq(videoSegments.videoId, courseVideos.videoId))
      .where(eq(courseVideos.courseId, courseId))
      .orderBy(asc(courseVideos.position))
      .limit(1),
  ]);
  const sample = (caption?.notes ?? "").replace(/\[\d{1,2}:\d{2}:\d{2}\]/g, " ").replace(/\s+/g, " ").slice(0, 700);
  const { json, usage } = await nemotronJson(
    "lightning",
    SYSTEM,
    `Title: ${course.title}\nChannel: ${course.channel}\nLessons: ${titles.map((l) => l.title).join("; ")}\nCaption sample: ${sample}`,
    SCHEMA,
    { think: false, maxTokens: 200, fallbacks: ["ultra"] },
  );
  const answer = (json ?? {}) as { tags?: unknown; language?: unknown };
  const found = (Array.isArray(answer.tags) ? answer.tags : []).filter(isCourseTag);
  const tags = [...new Set(found)].filter((t, _, all) => t !== "other" || all.length === 1).slice(0, 3);
  const saved = { tags: tags.length ? tags : ["other"], language: isCourseLanguage(answer.language) ? answer.language : "other" };
  await db.update(courses).set(saved).where(eq(courses.id, courseId));
  return { ...saved, usage };
}
