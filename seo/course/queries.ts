import { asc, count, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { channels, courses, lessons, placementQuestions, questions, videos } from "@/db/schema";
import { packDays } from "@/lib/pace";

/** The default pace a signed-out visitor (and Google) sees. Matches getCoursePlans in src/modules/course/queries.ts. */
const DEFAULT_MINUTES_PER_DAY = 90;

/**
 * Everything the SEO layer of a course page needs: public courses only, cached like getCoursePreview (and cleared by
 * the same tag when a private course goes public). Null for private or missing courses.
 */
export async function getCourseSeo(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`course-preview:${slug}`);
  const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
  if (!course || course.isPrivate) return null;
  const [rows, [{ quizzes }], [{ tests }]] = await Promise.all([
    db
    .select({
      position: lessons.position,
      title: lessons.title,
      summary: lessons.summary,
      seconds: lessons.endSeconds,
      start: lessons.startSeconds,
      channelId: videos.channelId,
    })
    .from(lessons)
    .innerJoin(videos, eq(videos.id, lessons.videoId))
    .where(eq(lessons.courseId, course.id))
    .orderBy(asc(lessons.position)),
    db.select({ quizzes: count() }).from(questions).innerJoin(lessons, eq(lessons.id, questions.lessonId)).where(eq(lessons.courseId, course.id)),
    db.select({ tests: count() }).from(placementQuestions).where(eq(placementQuestions.courseId, course.id)),
  ]);
  const outline = rows.map((r) => ({ position: r.position, title: r.title, summary: r.summary, seconds: Math.max(0, r.seconds - r.start) }));
  const days = packDays(outline.map((l) => l.seconds), DEFAULT_MINUTES_PER_DAY).at(-1) ?? 0;
  // The creator: the channel of the first video (a playlist is one creator's in almost every case).
  const channelId = rows.find((r) => r.channelId)?.channelId ?? null;
  const [channel] = channelId ? await db.select({ handle: channels.handle }).from(channels).where(eq(channels.id, channelId)) : [];
  const channelUrl = channel?.handle ? `https://www.youtube.com/${channel.handle}` : channelId ? `https://www.youtube.com/channel/${channelId}` : null;
  return {
    slug: course.slug,
    title: course.title,
    channel: course.channel,
    channelUrl,
    thumbnail: course.thumbnail,
    seconds: course.durationSeconds,
    status: course.status,
    language: course.language,
    createdAt: course.createdAt,
    sourceType: course.sourceType,
    minutesPerDay: DEFAULT_MINUTES_PER_DAY,
    days,
    quizQuestions: quizzes,
    placementTest: tests > 0,
    lessons: outline,
  };
}

export type CourseSeo = NonNullable<Awaited<ReturnType<typeof getCourseSeo>>>;

/** Worth indexing: built, with lessons. A failed or half-built course is a thin page and stays out of Google. */
export const isIndexable = (c: CourseSeo) => c.status === "ready" && c.lessons.length > 0;
