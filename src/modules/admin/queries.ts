import { asc, count, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { accounts, courseSteps, courses, enrollments, roadmapFollows, roadmaps, userDays, users } from "@/db/schema";
import { buildsPaused } from "@/lib/builds-paused";
import { getCourseProgress } from "@/modules/roadmap/queries";

// Every query here is for /admin only; callers check requireAdmin() first.
// Privacy policy: admins see account details, activity, courses, roadmaps and progress. Notes and quiz
// answers are only ever counted (or scored right/wrong), never shown.

export const PAGE_SIZE = 50;

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10); // YYYY-MM-DD, close enough across zones

/** Raw SQL rows. Every number is cast to ::int or ::float8 in the query, so the driver returns JS numbers. */
async function rows<T>(query: SQL) {
  const result = await db.execute(query);
  return result.rows as T[];
}

const like = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/**
 * Each learner's current and best streak, from user_day (a "visit" day in their own timezone).
 * Streaks are islands of consecutive days; one still running ended today or yesterday (UTC, close enough).
 */
const streaks = (where: SQL = sql`true`) => sql`
  select user_id, max(len)::int as best, coalesce(max(len) filter (where last >= current_date - 1), 0)::int as current
  from (
    select user_id, count(*) as len, max(d) as last
    from (
      select user_id, day::date as d, day::date - (row_number() over (partition by user_id order by day))::int as grp
      from user_day where ${where}
    ) g
    group by user_id, grp
  ) islands
  group by user_id`;

// --- Overview (/admin)

export type DayPoint = { day: string; active: number; signups: number };

/** Everything on the /admin overview, in one round of parallel queries. */
export async function getAdminOverview() {
  const today = daysAgo(0);
  const week = daysAgo(6);
  const month = daysAgo(29);

  const [[people], [active], [visitors], activeByDay, signupsByDay, [streakStats], topStreaks, [learning], [content], statuses, [builds], failures, inFlight] =
    await Promise.all([
      rows<{ total: number }>(sql`select count(*)::int as total from "user"`),
      rows<{ day: number; week: number; month: number }>(sql`
        select count(distinct user_id) filter (where day = ${today})::int as day,
               count(distinct user_id) filter (where day >= ${week})::int as week,
               count(distinct user_id)::int as month
        from user_day where day >= ${month}`),
      rows<{ seen: number; returned: number; newToday: number; newWeek: number; newMonth: number }>(sql`
        select count(*)::int as seen,
               count(*) filter (where n >= 2)::int as "returned",
               count(*) filter (where first = ${today})::int as "newToday",
               count(*) filter (where first >= ${week})::int as "newWeek",
               count(*) filter (where first >= ${month})::int as "newMonth"
        from (select user_id, count(*) as n, min(day) as first from user_day group by user_id) t`),
      rows<{ day: string; n: number }>(sql`select day, count(*)::int as n from user_day where day >= ${month} group by day`),
      rows<{ day: string; n: number }>(sql`
        select first as day, count(*)::int as n
        from (select min(day) as first from user_day group by user_id) t
        where first >= ${month} group by first`),
      rows<{ running: number; avg: number | null; longest: number | null }>(sql`
        select count(*) filter (where current > 0)::int as running,
               avg(current) filter (where current > 0)::float8 as avg,
               max(best)::int as longest
        from (${streaks()}) s`),
      rows<{ id: string; name: string | null; image: string | null; current: number; best: number }>(sql`
        select u.id, u.name, u.image, s.current, s.best
        from (${streaks()}) s join "user" u on u.id = s.user_id
        order by s.current desc, s.best desc limit 8`),
      rows<{
        watched: number;
        completed: number;
        seconds: number;
        answers: number;
        correct: number;
        placements: number;
        placementAvg: number | null;
        skips: number;
        notes: number;
        enrollments: number;
        roadmaps: number;
        published: number;
        follows: number;
      }>(sql`
        select (select count(*) from lesson_watch where watched_at is not null)::int as watched,
               (select count(*) from lesson_progress)::int as completed,
               (select coalesce(sum(watched_seconds), 0) from lesson_watch)::float8 as seconds,
               (select count(*) from attempt)::int as answers,
               (select count(*) from attempt where correct)::int as correct,
               (select count(*) from placement_result)::int as placements,
               (select avg(score::float8 / nullif(total, 0)) from placement_result)::float8 as "placementAvg",
               (select count(*) from lesson_skip)::int as skips,
               (select count(*) from note)::int as notes,
               (select count(*) from enrollment)::int as enrollments,
               (select count(*) from roadmap)::int as roadmaps,
               (select count(*) from roadmap where published)::int as published,
               (select count(*) from roadmap_follow)::int as follows`),
      rows<{ videos: number; videoSeconds: number; lessons: number; questions: number; placementQuestions: number; channels: number }>(sql`
        select (select count(*) from video)::int as videos,
               (select coalesce(sum(duration_seconds), 0) from video)::float8 as "videoSeconds",
               (select count(*) from lesson)::int as lessons,
               (select count(*) from question)::int as questions,
               (select count(*) from placement_question)::int as "placementQuestions",
               (select count(distinct channel) from course)::int as channels`),
      db.select({ status: courses.status, n: count() }).from(courses).groupBy(courses.status),
      rows<{ thisWeek: number; medianSeconds: number | null }>(sql`
        select (select count(*) from course where created_at >= now() - interval '7 days')::int as "thisWeek",
               (select percentile_cont(0.5) within group (order by secs)
                from (select extract(epoch from max(s.finished_at) - min(s.started_at)) as secs
                      from course_step s join course c on c.id = s.course_id
                      where c.status = 'ready' group by s.course_id) b)::float8 as "medianSeconds"`),
      db
        .select({ id: courses.id, slug: courses.slug, title: courses.title, error: courses.error, createdAt: courses.createdAt, creator: users.name })
        .from(courses)
        .leftJoin(users, eq(users.id, courses.createdBy))
        .where(eq(courses.status, "failed"))
        .orderBy(desc(courses.createdAt))
        .limit(6),
      db
        .select({ id: courses.id, slug: courses.slug, title: courses.title, status: courses.status, progress: courses.progress, createdAt: courses.createdAt })
        .from(courses)
        .where(sql`${courses.status} in ('queued', 'reading', 'building')`)
        .orderBy(desc(courses.createdAt))
        .limit(6),
    ]);

  // One point per day for the last 30 days, zero where nobody came.
  const activeMap = new Map(activeByDay.map((r) => [r.day, r.n]));
  const signupMap = new Map(signupsByDay.map((r) => [r.day, r.n]));
  const series: DayPoint[] = Array.from({ length: 30 }, (_, i) => {
    const day = daysAgo(29 - i);
    return { day, active: activeMap.get(day) ?? 0, signups: signupMap.get(day) ?? 0 };
  });

  const by = Object.fromEntries(statuses.map((s) => [s.status, s.n])) as Record<string, number>;
  const courseCount = statuses.reduce((t, s) => t + s.n, 0);

  return {
    people: people.total,
    neverVisited: people.total - visitors.seen,
    active,
    signups: { today: visitors.newToday, week: visitors.newWeek, month: visitors.newMonth },
    returnRate: visitors.seen ? visitors.returned / visitors.seen : 0,
    series,
    streaks: { ...streakStats, top: topStreaks.filter((s) => s.current > 0) },
    learning,
    content,
    builds: {
      total: courseCount,
      ready: by.ready ?? 0,
      failed: by.failed ?? 0,
      queued: by.queued ?? 0,
      reading: by.reading ?? 0,
      building: by.building ?? 0,
      thisWeek: builds.thisWeek,
      medianSeconds: builds.medianSeconds,
      paused: buildsPaused(),
      failures,
      inFlight,
    },
  };
}
export type AdminOverview = Awaited<ReturnType<typeof getAdminOverview>>;

// --- Learners table (/admin/users)

export const USER_SORTS = {
  active: "last_seen",
  streak: "streak",
  best: "best",
  days: "days",
  enrolled: "enrolled",
  built: "built",
  lessons: "lessons",
  watched: "watched",
  accuracy: "accuracy",
  joined: "first_seen",
} as const;
export type UserSort = keyof typeof USER_SORTS;

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  providers: string | null;
  firstSeen: string | null;
  lastSeen: string | null;
  days: number;
  streak: number;
  best: number;
  enrolled: number;
  built: number;
  lessons: number;
  watched: number;
  answers: number;
  accuracy: number | null;
};

/** One page of learners with their activity, streaks and learning totals, sorted by any column. */
export async function getAdminUsers({ q = "", sort = "active", page = 0 }: { q?: string; sort?: UserSort; page?: number }) {
  const match = q ? sql`(u.name ilike ${like(q)} or u.email ilike ${like(q)})` : sql`true`;
  const column = sql.raw(USER_SORTS[sort] ?? USER_SORTS.active);
  const [list, [{ total }]] = await Promise.all([
    rows<AdminUserRow>(sql`
      with s as (${streaks()}),
      r as (
        select u.id, u.name, u.email, u.image,
               (select string_agg(a.provider, ', ') from account a where a."userId" = u.id) as providers,
               (select min(d.day) from user_day d where d.user_id = u.id) as first_seen,
               (select max(d.day) from user_day d where d.user_id = u.id) as last_seen,
               (select count(*) from user_day d where d.user_id = u.id)::int as days,
               coalesce(s.current, 0)::int as streak,
               coalesce(s.best, 0)::int as best,
               (select count(*) from enrollment e where e.user_id = u.id)::int as enrolled,
               (select count(*) from course c where c.created_by = u.id)::int as built,
               (select count(*) from (
                  select w.lesson_id from lesson_watch w where w.user_id = u.id and w.watched_at is not null
                  union select p.lesson_id from lesson_progress p where p.user_id = u.id) x)::int as lessons,
               (select coalesce(sum(w.watched_seconds), 0) from lesson_watch w where w.user_id = u.id)::float8 as watched,
               (select count(*) from attempt t where t.user_id = u.id)::int as answers,
               (select count(*) from attempt t where t.user_id = u.id and t.correct)::int as correct
        from "user" u left join s on s.user_id = u.id
        where ${match}
      )
      select id, name, email, image, providers, first_seen as "firstSeen", last_seen as "lastSeen", days, streak, best,
             enrolled, built, lessons, watched, answers, accuracy
      from (select *, case when answers > 0 then correct::float8 / answers end as accuracy from r) r
      order by ${column} desc nulls last, name asc nulls last, id
      limit ${PAGE_SIZE} offset ${page * PAGE_SIZE}`),
    rows<{ total: number }>(sql`select count(*)::int as total from "user" u where ${match}`),
  ]);
  return { list, total };
}

// --- One learner (/admin/users/[id])

const providers = sql<string | null>`(select string_agg(${accounts.provider}, ', ') from ${accounts} where ${accounts.userId} = ${users.id})`;
const firstSeen = sql<string | null>`(select min(${userDays.day}) from ${userDays} where ${userDays.userId} = ${users.id})`;
const lastSeen = sql<string | null>`(select max(${userDays.day}) from ${userDays} where ${userDays.userId} = ${users.id})`;

type CourseStat = { courseId: string; skipped: number; answers: number; correct: number; seconds: number };

/**
 * One learner, for answering their support questions: account, activity, streaks, courses with progress,
 * roadmaps. Notes and quiz answers are counted, never shown (see the privacy policy).
 */
export async function getAdminUser(userId: string) {
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, image: users.image, timezone: users.timezone, minutesPerDay: users.minutesPerDay, providers, firstSeen, lastSeen })
    .from(users)
    .where(eq(users.id, userId));
  if (!user) return null;

  const [activeDays, [streak], [totals], perCourse, placements, taking, built, owned, following] = await Promise.all([
    rows<{ day: string }>(sql`select day from user_day where user_id = ${userId} and day >= ${daysAgo(181)} order by day`),
    rows<{ current: number; best: number }>(streaks(sql`user_id = ${userId}`)),
    rows<{ days: number; lessons: number; seconds: number; answers: number; correct: number; notes: number; skips: number }>(sql`
      select (select count(*) from user_day where user_id = ${userId})::int as days,
             (select count(*) from (
                select lesson_id from lesson_watch where user_id = ${userId} and watched_at is not null
                union select lesson_id from lesson_progress where user_id = ${userId}) x)::int as lessons,
             (select coalesce(sum(watched_seconds), 0) from lesson_watch where user_id = ${userId})::float8 as seconds,
             (select count(*) from attempt where user_id = ${userId})::int as answers,
             (select count(*) from attempt where user_id = ${userId} and correct)::int as correct,
             (select count(*) from note where user_id = ${userId})::int as notes,
             (select count(*) from lesson_skip where user_id = ${userId})::int as skips`),
    rows<CourseStat>(sql`
      select course_id as "courseId",
             sum(skipped)::int as skipped, sum(answers)::int as answers, sum(correct)::int as correct, sum(seconds)::float8 as seconds
      from (
        select course_id, 1 as skipped, 0 as answers, 0 as correct, 0 as seconds from lesson_skip where user_id = ${userId}
        union all select course_id, 0, 1, case when correct then 1 else 0 end, 0 from attempt where user_id = ${userId}
        union all select course_id, 0, 0, 0, watched_seconds from lesson_watch where user_id = ${userId}
      ) t group by course_id`),
    rows<{ courseId: string; score: number; total: number }>(sql`select course_id as "courseId", score, total from placement_result where user_id = ${userId}`),
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
  ]);

  const progress = await getCourseProgress(userId, taking.map((c) => c.id));
  const stats = new Map(perCourse.map((s) => [s.courseId, s]));
  const placement = new Map(placements.map((p) => [p.courseId, p]));

  return {
    ...user,
    ...totals,
    streak: streak ?? { current: 0, best: 0 },
    activeDays: activeDays.map((d) => d.day),
    taking: taking.map((c) => {
      const s = stats.get(c.id);
      const p = progress.get(c.id);
      return {
        ...c,
        pct: p?.pct ?? 0,
        done: p?.done ?? 0,
        total: p?.total ?? 0,
        skipped: s?.skipped ?? 0,
        answers: s?.answers ?? 0,
        correct: s?.correct ?? 0,
        seconds: s?.seconds ?? 0,
        placement: placement.get(c.id) ?? null,
      };
    }),
    built,
    owned,
    following,
  };
}
export type AdminUser = NonNullable<Awaited<ReturnType<typeof getAdminUser>>>;

// --- Courses (/admin/courses)

export const COURSE_SORTS = { newest: "created", learners: "learners", finished: "finished", accuracy: "accuracy", lessons: "lessons" } as const;
export type CourseSort = keyof typeof COURSE_SORTS;
export const COURSE_STATUSES = ["queued", "reading", "building", "ready", "failed"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export type AdminCourseRow = {
  id: string;
  slug: string;
  title: string;
  channel: string;
  thumbnail: string | null;
  status: CourseStatus;
  progress: number;
  sourceType: "video" | "playlist";
  durationSeconds: number;
  created: number; // epoch ms
  creatorId: string | null;
  creator: string | null;
  lessons: number;
  learners: number;
  finished: number;
  answers: number;
  accuracy: number | null;
  buildSeconds: number | null;
};

const courseColumns = sql`
  c.id, c.slug, c.title, c.channel, c.thumbnail, c.status, c.progress, c.source_type as "sourceType", c.duration_seconds as "durationSeconds",
  (extract(epoch from c.created_at) * 1000)::float8 as created,
  c.created_by as "creatorId", u.name as creator,
  (select count(*) from lesson l where l.course_id = c.id)::int as lessons,
  (select count(*) from enrollment e where e.course_id = c.id)::int as learners,
  (select count(*) from (
     select x.user_id from (
       select w.user_id, w.lesson_id from lesson_watch w where w.course_id = c.id and w.watched_at is not null
       union select p.user_id, p.lesson_id from lesson_progress p where p.course_id = c.id) x
     group by x.user_id
     having count(*) >= (select greatest(count(*), 1) from lesson l where l.course_id = c.id)) f)::int as finished,
  (select count(*) from attempt t where t.course_id = c.id)::int as answers,
  (select count(*) filter (where t.correct)::float8 / nullif(count(*), 0) from attempt t where t.course_id = c.id)::float8 as accuracy,
  (select extract(epoch from max(s.finished_at) - min(s.started_at)) from course_step s where s.course_id = c.id)::float8 as "buildSeconds"`;

/** One page of courses with who built them, how many take them, finish them, and quiz accuracy. */
export async function getAdminCourses({ q = "", status, sort = "newest", page = 0 }: { q?: string; status?: CourseStatus; sort?: CourseSort; page?: number }) {
  const where = sql.join(
    [q ? sql`(c.title ilike ${like(q)} or c.channel ilike ${like(q)})` : sql`true`, status ? sql`c.status = ${status}` : sql`true`],
    sql` and `,
  );
  const column = sql.raw(COURSE_SORTS[sort] ?? COURSE_SORTS.newest);
  const [list, [{ total }], statuses, creators] = await Promise.all([
    rows<AdminCourseRow>(sql`
      select * from (select ${courseColumns} from course c left join "user" u on u.id = c.created_by where ${where}) r
      order by ${column} desc nulls last, created desc
      limit ${PAGE_SIZE} offset ${page * PAGE_SIZE}`),
    rows<{ total: number }>(sql`select count(*)::int as total from course c where ${where}`),
    db.select({ status: courses.status, n: count() }).from(courses).groupBy(courses.status),
    rows<{ channel: string; courses: number; learners: number }>(sql`
      select c.channel, count(distinct c.id)::int as courses, count(e.user_id)::int as learners
      from course c left join enrollment e on e.course_id = c.id
      group by c.channel order by learners desc, courses desc limit 8`),
  ]);
  return { list, total, statuses: Object.fromEntries(statuses.map((s) => [s.status, s.n])) as Partial<Record<CourseStatus, number>>, creators };
}

/** One course: build log, lesson-by-lesson drop-off, and the learners taking it. */
export async function getAdminCourse(id: string) {
  const [course] = await rows<AdminCourseRow & { error: string | null }>(sql`
    select ${courseColumns}, c.error from course c left join "user" u on u.id = c.created_by where c.id = ${id}`);
  if (!course) return null;

  const [steps, lessonRows, people, [placement]] = await Promise.all([
    db
      .select({ key: courseSteps.key, label: courseSteps.label, detail: courseSteps.detail, status: courseSteps.status, startedAt: courseSteps.startedAt, finishedAt: courseSteps.finishedAt })
      .from(courseSteps)
      .where(eq(courseSteps.courseId, id))
      .orderBy(asc(courseSteps.startedAt)),
    rows<{ id: string; position: number; title: string; ready: boolean; watched: number; completed: number; skipped: number; answers: number; accuracy: number | null }>(sql`
      select l.id, l.position, l.title, l.ready,
             (select count(*) from lesson_watch w where w.lesson_id = l.id and w.watched_at is not null)::int as watched,
             (select count(*) from lesson_progress p where p.lesson_id = l.id)::int as completed,
             (select count(*) from lesson_skip k where k.lesson_id = l.id)::int as skipped,
             (select count(*) from attempt t where t.lesson_id = l.id)::int as answers,
             (select count(*) filter (where t.correct)::float8 / nullif(count(*), 0) from attempt t where t.lesson_id = l.id)::float8 as accuracy
      from lesson l where l.course_id = ${id} order by l.position`),
    rows<{ id: string; name: string | null; image: string | null; enrolled: number; opened: number; done: number; answers: number; accuracy: number | null }>(sql`
      select u.id, u.name, u.image,
             (extract(epoch from e.created_at) * 1000)::float8 as enrolled,
             (extract(epoch from e.last_opened_at) * 1000)::float8 as opened,
             (select count(*) from (
                select w.lesson_id from lesson_watch w where w.user_id = u.id and w.course_id = ${id} and w.watched_at is not null
                union select p.lesson_id from lesson_progress p where p.user_id = u.id and p.course_id = ${id}) x)::int as done,
             (select count(*) from attempt t where t.user_id = u.id and t.course_id = ${id})::int as answers,
             (select count(*) filter (where t.correct)::float8 / nullif(count(*), 0) from attempt t where t.user_id = u.id and t.course_id = ${id})::float8 as accuracy
      from enrollment e join "user" u on u.id = e.user_id
      where e.course_id = ${id} order by e.last_opened_at desc limit 100`),
    rows<{ taken: number; avg: number | null }>(sql`
      select count(*)::int as taken, avg(score::float8 / nullif(total, 0))::float8 as avg from placement_result where course_id = ${id}`),
  ]);

  return { ...course, steps, lessonRows, people, placement };
}
export type AdminCourse = NonNullable<Awaited<ReturnType<typeof getAdminCourse>>>;

// --- Roadmaps (/admin/roadmaps)

export type AdminRoadmapRow = {
  id: string;
  slug: string;
  title: string;
  published: boolean;
  updated: number; // epoch ms
  ownerId: string;
  owner: string | null;
  stages: number;
  courses: number;
  followers: number;
};

/** One page of roadmaps with owner, size and followers. `show` narrows to Community (published) or private ones. */
export async function getAdminRoadmaps({ q = "", show, page = 0 }: { q?: string; show?: "published" | "private"; page?: number }) {
  const where = sql.join(
    [
      q ? sql`(r.title ilike ${like(q)} or u.name ilike ${like(q)})` : sql`true`,
      show === "published" ? sql`r.published` : show === "private" ? sql`not r.published` : sql`true`,
    ],
    sql` and `,
  );
  const [list, [{ total }]] = await Promise.all([
    rows<AdminRoadmapRow>(sql`
      select r.id, r.slug, r.title, r.published, (extract(epoch from r.updated_at) * 1000)::float8 as updated,
             r.owner_id as "ownerId", u.name as owner,
             (select count(*) from roadmap_stage s where s.roadmap_id = r.id)::int as stages,
             (select count(*) from roadmap_course c where c.roadmap_id = r.id)::int as courses,
             (select count(*) from roadmap_follow f where f.roadmap_id = r.id)::int as followers
      from roadmap r join "user" u on u.id = r.owner_id
      where ${where}
      order by followers desc, r.updated_at desc
      limit ${PAGE_SIZE} offset ${page * PAGE_SIZE}`),
    rows<{ total: number }>(sql`select count(*)::int as total from roadmap r join "user" u on u.id = r.owner_id where ${where}`),
  ]);
  return { list, total };
}
