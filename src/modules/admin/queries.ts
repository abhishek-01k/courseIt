import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, attempts, courses, enrollments, notes, roadmapFollows, roadmaps, userDays, users } from "@/db/schema";
import { getCourseProgress } from "@/modules/roadmap/queries";

// Every query here is for /admin only; callers check requireAdmin() first.

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10); // YYYY-MM-DD, close enough across zones

/** The numbers at the top of /admin. */
export async function getAdminStats() {
  const [[{ people }], [{ active }], statuses, [{ taken }], [{ made, published }]] = await Promise.all([
    db.select({ people: count() }).from(users),
    db.select({ active: sql<number>`count(distinct ${userDays.userId})`.mapWith(Number) }).from(userDays).where(sql`${userDays.day} >= ${daysAgo(7)}`),
    db.select({ status: courses.status, n: count() }).from(courses).groupBy(courses.status),
    db.select({ taken: count() }).from(enrollments),
    db.select({ made: count(), published: sql<number>`count(*) filter (where ${roadmaps.published})`.mapWith(Number) }).from(roadmaps),
  ]);
  const by = Object.fromEntries(statuses.map((s) => [s.status, s.n]));
  const courseCount = statuses.reduce((t, s) => t + s.n, 0);
  return { people, active, courseCount, ready: by.ready ?? 0, failed: by.failed ?? 0, building: courseCount - (by.ready ?? 0) - (by.failed ?? 0), taken, made, published };
}

const firstSeen = sql<string | null>`(select min(${userDays.day}) from ${userDays} where ${userDays.userId} = ${users.id})`;
const lastSeen = sql<string | null>`(select max(${userDays.day}) from ${userDays} where ${userDays.userId} = ${users.id})`;
const providers = sql<string | null>`(select string_agg(${accounts.provider}, ', ') from ${accounts} where ${accounts.userId} = ${users.id})`;

// ponytail: the 100 most recently active matching the search; page it when there are more learners than that.
export function getAdminUsers(q = "") {
  const match = q ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)) : undefined;
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      providers,
      firstSeen,
      lastSeen,
      courses: db.$count(enrollments, eq(enrollments.userId, users.id)),
      roadmaps: db.$count(roadmaps, eq(roadmaps.ownerId, users.id)),
    })
    .from(users)
    .where(match)
    .orderBy(sql`${lastSeen} desc nulls last`, users.name)
    .limit(100);
}

/**
 * One learner, for answering their support questions: account, activity, courses with progress, roadmaps.
 * Notes and quiz answers are counted, never shown (see the privacy policy).
 */
export async function getAdminUser(userId: string) {
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, image: users.image, timezone: users.timezone, minutesPerDay: users.minutesPerDay, providers, firstSeen, lastSeen })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) return null;

  const [[{ days }], taking, built, owned, enrolledIn, [{ noteCount }], [{ answerCount }]] = await Promise.all([
    db.select({ days: count() }).from(userDays).where(eq(userDays.userId, userId)),
    db
      .select({ id: courses.id, slug: courses.slug, title: courses.title, thumbnail: courses.thumbnail, status: courses.status, enrolledAt: enrollments.createdAt, lastOpenedAt: enrollments.lastOpenedAt })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(eq(enrollments.userId, userId))
      .orderBy(desc(enrollments.lastOpenedAt)),
    db.select({ id: courses.id, slug: courses.slug, title: courses.title, status: courses.status, error: courses.error, createdAt: courses.createdAt }).from(courses).where(eq(courses.createdBy, userId)).orderBy(desc(courses.createdAt)),
    db.select({ id: roadmaps.id, slug: roadmaps.slug, title: roadmaps.title, published: roadmaps.published }).from(roadmaps).where(eq(roadmaps.ownerId, userId)).orderBy(desc(roadmaps.updatedAt)),
    db
      .select({ id: roadmaps.id, slug: roadmaps.slug, title: roadmaps.title, published: roadmaps.published })
      .from(roadmapFollows)
      .innerJoin(roadmaps, eq(roadmaps.id, roadmapFollows.roadmapId))
      .where(eq(roadmapFollows.userId, userId))
      .orderBy(desc(roadmapFollows.createdAt)),
    db.select({ noteCount: count() }).from(notes).where(eq(notes.userId, userId)),
    db.select({ answerCount: count() }).from(attempts).where(eq(attempts.userId, userId)),
  ]);
  const progress = await getCourseProgress(userId, taking.map((c) => c.id));
  return {
    ...user,
    days,
    noteCount,
    answerCount,
    taking: taking.map((c) => ({ ...c, pct: progress.get(c.id)?.pct ?? 0 })),
    built,
    owned,
    enrolledIn,
  };
}
export type AdminUser = NonNullable<Awaited<ReturnType<typeof getAdminUser>>>;
