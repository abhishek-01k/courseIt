import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses, lessonProgress, lessons, lessonWatch, roadmapCourses, roadmapFollows, roadmaps, roadmapStages, users } from "@/db/schema";

/** Lessons done (watched to 80% or quiz done, as in the course plan) out of all lessons, per course. */
export async function getCourseProgress(userId: string, courseIds: string[]) {
  const out = new Map<string, { done: number; total: number; pct: number }>();
  if (!courseIds.length) return out;
  const rows = await db
    .select({
      courseId: lessons.courseId,
      total: count(),
      done: sql<number>`count(*) filter (where ${lessonWatch.watchedAt} is not null or ${lessonProgress.lessonId} is not null)`.mapWith(Number),
    })
    .from(lessons)
    .leftJoin(lessonWatch, and(eq(lessonWatch.lessonId, lessons.id), eq(lessonWatch.userId, userId)))
    .leftJoin(lessonProgress, and(eq(lessonProgress.lessonId, lessons.id), eq(lessonProgress.userId, userId)))
    .where(inArray(lessons.courseId, courseIds))
    .groupBy(lessons.courseId);
  for (const r of rows) out.set(r.courseId, { done: r.done, total: r.total, pct: r.total ? Math.round((r.done / r.total) * 100) : 0 });
  return out;
}

type Summary = { id: string; slug: string; title: string; published: boolean; updatedAt: Date; author: string | null };

/** Stages, course count, hours, creators and (for `userId`) progress for a list of roadmaps, in one pass. */
async function summarize<T extends Summary>(list: T[], userId?: string) {
  if (!list.length) return [];
  const ids = list.map((r) => r.id);
  const [stages, items, follows] = await Promise.all([
    db.select({ roadmapId: roadmapStages.roadmapId, name: roadmapStages.name }).from(roadmapStages).where(inArray(roadmapStages.roadmapId, ids)).orderBy(asc(roadmapStages.position)),
    db
      .select({ roadmapId: roadmapCourses.roadmapId, courseId: courses.id, channel: courses.channel, durationSeconds: courses.durationSeconds, thumbnail: courses.thumbnail })
      .from(roadmapCourses)
      .innerJoin(courses, eq(courses.id, roadmapCourses.courseId))
      .innerJoin(roadmapStages, eq(roadmapStages.id, roadmapCourses.stageId))
      .where(inArray(roadmapCourses.roadmapId, ids))
      .orderBy(asc(roadmapStages.position), asc(roadmapCourses.position)), // roadmap order, for the cover
    db.select({ roadmapId: roadmapFollows.roadmapId, n: count() }).from(roadmapFollows).where(inArray(roadmapFollows.roadmapId, ids)).groupBy(roadmapFollows.roadmapId),
  ]);
  const progress = userId ? await getCourseProgress(userId, [...new Set(items.map((i) => i.courseId))]) : new Map();
  return list.map((r) => {
    const mine = items.filter((i) => i.roadmapId === r.id);
    const lessonTotals = mine.map((i) => progress.get(i.courseId) ?? { done: 0, total: 0 });
    const total = lessonTotals.reduce((t, p) => t + p.total, 0);
    const done = lessonTotals.reduce((t, p) => t + p.done, 0);
    return {
      ...r,
      stages: stages.filter((s) => s.roadmapId === r.id).map((s) => s.name),
      covers: mine.flatMap((i) => (i.thumbnail ? [i.thumbnail] : [])).slice(0, 4), // the card's cover: its first courses
      courseCount: mine.length,
      seconds: mine.reduce((t, i) => t + i.durationSeconds, 0),
      creators: [...new Set(mine.map((i) => i.channel))],
      pct: total ? Math.round((done / total) * 100) : 0,
      followers: follows.find((f) => f.roadmapId === r.id)?.n ?? 0,
    };
  });
}

const summaryColumns = { id: roadmaps.id, slug: roadmaps.slug, title: roadmaps.title, published: roadmaps.published, updatedAt: roadmaps.updatedAt, author: users.name };

/** Roadmaps you made, and published roadmaps you follow (they stay in sync with their creator's changes). */
export async function getMyRoadmaps(userId: string) {
  const [mine, following] = await Promise.all([
    db.select(summaryColumns).from(roadmaps).innerJoin(users, eq(users.id, roadmaps.ownerId)).where(eq(roadmaps.ownerId, userId)).orderBy(desc(roadmaps.updatedAt)),
    db
      .select(summaryColumns)
      .from(roadmapFollows)
      .innerJoin(roadmaps, eq(roadmaps.id, roadmapFollows.roadmapId))
      .innerJoin(users, eq(users.id, roadmaps.ownerId))
      .where(and(eq(roadmapFollows.userId, userId), eq(roadmaps.published, true)))
      .orderBy(desc(roadmapFollows.createdAt)),
  ]);
  const [a, b] = await Promise.all([summarize(mine, userId), summarize(following, userId)]);
  return { mine: a, following: b };
}
export type RoadmapSummary = Awaited<ReturnType<typeof getMyRoadmaps>>["mine"][number];

// ponytail: newest 60 matching the search; paging when Community has more roadmaps than fit.
/** Published roadmaps; `viewerId` gets their own progress on each card. */
export async function getPublishedRoadmaps(q = "", viewerId?: string) {
  const match = q ? or(ilike(roadmaps.title, `%${q}%`), ilike(roadmaps.description, `%${q}%`), ilike(users.name, `%${q}%`)) : undefined;
  const list = await db
    .select(summaryColumns)
    .from(roadmaps)
    .innerJoin(users, eq(users.id, roadmaps.ownerId))
    .where(and(eq(roadmaps.published, true), match))
    .orderBy(desc(roadmaps.updatedAt))
    .limit(60);
  return summarize(list, viewerId);
}

export async function countPublishedRoadmaps() {
  const [{ n }] = await db.select({ n: count() }).from(roadmaps).where(eq(roadmaps.published, true));
  return n;
}

/**
 * One roadmap with its stages and courses, for the owner or (once published) anyone, signed in or not.
 * Progress is the viewer's own.
 */
export async function getRoadmap(slug: string, viewerId: string | null) {
  const [roadmap] = await db
    .select({ id: roadmaps.id, slug: roadmaps.slug, title: roadmaps.title, description: roadmaps.description, published: roadmaps.published, ownerId: roadmaps.ownerId, updatedAt: roadmaps.updatedAt, author: users.name })
    .from(roadmaps)
    .innerJoin(users, eq(users.id, roadmaps.ownerId))
    .where(eq(roadmaps.slug, slug));
  if (!roadmap || (!roadmap.published && roadmap.ownerId !== viewerId)) return null;

  const [stages, items, [{ followerCount }], followers, [following]] = await Promise.all([
    db.select().from(roadmapStages).where(eq(roadmapStages.roadmapId, roadmap.id)).orderBy(asc(roadmapStages.position)),
    db
      .select({ stageId: roadmapCourses.stageId, id: courses.id, slug: courses.slug, title: courses.title, channel: courses.channel, thumbnail: courses.thumbnail, durationSeconds: courses.durationSeconds, status: courses.status })
      .from(roadmapCourses)
      .innerJoin(courses, eq(courses.id, roadmapCourses.courseId))
      .where(eq(roadmapCourses.roadmapId, roadmap.id))
      .orderBy(asc(roadmapCourses.position)),
    db.select({ followerCount: count() }).from(roadmapFollows).where(eq(roadmapFollows.roadmapId, roadmap.id)),
    db
      .select({ id: users.id, name: users.name, image: users.image })
      .from(roadmapFollows)
      .innerJoin(users, eq(users.id, roadmapFollows.userId))
      .where(eq(roadmapFollows.roadmapId, roadmap.id))
      .orderBy(desc(roadmapFollows.createdAt))
      .limit(12),
    viewerId
      ? db.select({ userId: roadmapFollows.userId }).from(roadmapFollows).where(and(eq(roadmapFollows.roadmapId, roadmap.id), eq(roadmapFollows.userId, viewerId)))
      : Promise.resolve([]),
  ]);
  const progress = viewerId ? await getCourseProgress(viewerId, items.map((i) => i.id)) : new Map<string, { done: number; total: number; pct: number }>();
  const withPct = items.map((i) => ({ ...i, pct: progress.get(i.id)?.pct ?? 0, lessons: progress.get(i.id)?.total ?? 0 }));
  const done = items.reduce((t, i) => t + (progress.get(i.id)?.done ?? 0), 0);
  const total = items.reduce((t, i) => t + (progress.get(i.id)?.total ?? 0), 0);
  return {
    ...roadmap,
    isOwner: roadmap.ownerId === viewerId,
    isFollowing: Boolean(following),
    followerCount,
    followers,
    stages: stages.map((s) => ({ ...s, courses: withPct.filter((i) => i.stageId === s.id) })),
    courseCount: items.length,
    seconds: items.reduce((t, i) => t + i.durationSeconds, 0),
    coursesDone: withPct.filter((i) => i.lessons > 0 && i.pct === 100).length,
    pct: total ? Math.round((done / total) * 100) : 0,
    creators: [...new Set(items.map((i) => i.channel))],
  };
}
export type RoadmapView = NonNullable<Awaited<ReturnType<typeof getRoadmap>>>;

/** The learner's roadmaps for "Add to a roadmap": each with its stages and the stage that already has this course. */
export async function getRoadmapsForCourse(userId: string, courseId: string) {
  const mine = await db.select({ id: roadmaps.id, title: roadmaps.title }).from(roadmaps).where(eq(roadmaps.ownerId, userId)).orderBy(desc(roadmaps.updatedAt));
  if (!mine.length) return [];
  const ids = mine.map((r) => r.id);
  const [stages, placed, counts] = await Promise.all([
    db.select({ id: roadmapStages.id, roadmapId: roadmapStages.roadmapId, name: roadmapStages.name }).from(roadmapStages).where(inArray(roadmapStages.roadmapId, ids)).orderBy(asc(roadmapStages.position)),
    db
      .select({ roadmapId: roadmapCourses.roadmapId, stage: roadmapStages.name })
      .from(roadmapCourses)
      .innerJoin(roadmapStages, eq(roadmapStages.id, roadmapCourses.stageId))
      .where(and(inArray(roadmapCourses.roadmapId, ids), eq(roadmapCourses.courseId, courseId))),
    db.select({ roadmapId: roadmapCourses.roadmapId, n: count() }).from(roadmapCourses).where(inArray(roadmapCourses.roadmapId, ids)).groupBy(roadmapCourses.roadmapId),
  ]);
  return mine.map((r) => ({
    ...r,
    stages: stages.filter((s) => s.roadmapId === r.id).map(({ id, name }) => ({ id, name })),
    inStage: placed.find((p) => p.roadmapId === r.id)?.stage ?? null,
    courseCount: counts.find((c) => c.roadmapId === r.id)?.n ?? 0,
  }));
}
export type RoadmapChoice = Awaited<ReturnType<typeof getRoadmapsForCourse>>[number];
