import { sql } from "drizzle-orm";
import { daysAgo, paidSql, streaks } from "./learner-where";
import { rows } from "./queries";

// Numbers for /admin/stats: investors, grant forms and social posts. Every figure is defined in DEFINITIONS,
// and only figures with a real history get a "vs previous period" change (watch time is stored as a running
// total per lesson, so it can't be split by date).

export const RANGES = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days", all: "Since launch" } as const;
export type Range = keyof typeof RANGES;
export const parseRange = (v: string | undefined): Range => (v && v in RANGES ? (v as Range) : "30");

export const DEFINITIONS: { term: string; text: string }[] = [
  { term: "Learner", text: "an account on CourseIt (signed in with Google, GitHub or X). Page views and visitors aren't counted." },
  { term: "New learner", text: "counted on the first day they opened CourseIt while signed in (UTC days)." },
  { term: "Active learner", text: "opened CourseIt while signed in on that day, or at least once in the period." },
  { term: "Actually learning", text: "watched part of a lesson or answered a quiz question in the period." },
  { term: "Hours watched", text: "unique seconds of lesson video seen; skipping ahead or rewatching doesn't add time." },
  { term: "Lessons completed", text: "every quiz question in the lesson answered." },
  { term: "Paying learner", text: "on Basic, Pro or Max right now (cancelled ones count until their paid period ends)." },
  { term: "Came back", text: "of the learners who first came in that week, the share who opened CourseIt again within the window shown." },
];

type Totals = {
  learners: number;
  paying: number;
  seconds: number;
  watched: number;
  completed: number;
  answers: number;
  correct: number;
  courses: number;
  builders: number;
  enrollments: number;
  roadmaps: number;
  longest: number;
  firstDay: string | null;
};
type Period = { newLearners: number; active: number; learning: number; answers: number; completed: number; courses: number; enrollments: number };
export type StatsDay = { day: string; signups: number; active: number; total: number; answers: number; completed: number; courses: number; enrollments: number };
export type Cohort = { week: string; size: number; d1: number | null; w1: number | null; w2: number | null; w4: number | null };
type Champ = { id: string; name: string | null; image: string | null; value: number };

const period = (from: string, to: string) =>
  rows<Period>(sql`
    select (select count(*) from (select user_id from user_day group by user_id having min(day) between ${from} and ${to}) f)::int as "newLearners",
           (select count(distinct user_id) from user_day where day between ${from} and ${to})::int as active,
           (select count(*) from (
              select user_id from attempt where day between ${from} and ${to}
              union select user_id from lesson_watch where watched_seconds > 0 and updated_at >= ${from}::date and updated_at < ${to}::date + 1) l)::int as learning,
           (select count(*) from attempt where created_at >= ${from}::date and created_at < ${to}::date + 1)::int as answers,
           (select count(*) from lesson_progress where completed_at >= ${from}::date and completed_at < ${to}::date + 1)::int as completed,
           (select count(*) from course where status = 'ready' and created_at >= ${from}::date and created_at < ${to}::date + 1)::int as courses,
           (select count(*) from enrollment where created_at >= ${from}::date and created_at < ${to}::date + 1)::int as enrollments`).then((r) => r[0]);

/** One row per day from `from` to today, every count by UTC day. */
export async function dailySeries(from: string): Promise<StatsDay[]> {
  return rows<StatsDay>(sql`
    with days as (select to_char(d, 'YYYY-MM-DD') as day from generate_series(${from}::date, current_date, interval '1 day') d),
    firsts as (select min(day) as day from user_day group by user_id),
    by_signup as (select day, count(*) as n from firsts group by day),
    by_active as (select day, count(*) as n from user_day group by day),
    by_answer as (select to_char(created_at, 'YYYY-MM-DD') as day, count(*) as n from attempt group by 1),
    by_done as (select to_char(completed_at, 'YYYY-MM-DD') as day, count(*) as n from lesson_progress group by 1),
    by_course as (select to_char(created_at, 'YYYY-MM-DD') as day, count(*) as n from course where status = 'ready' group by 1),
    by_enrol as (select to_char(created_at, 'YYYY-MM-DD') as day, count(*) as n from enrollment group by 1)
    select days.day,
           coalesce(s.n, 0)::int as signups,
           coalesce(a.n, 0)::int as active,
           (select count(*) from firsts f where f.day <= days.day)::int as total,
           coalesce(q.n, 0)::int as answers,
           coalesce(p.n, 0)::int as completed,
           coalesce(c.n, 0)::int as courses,
           coalesce(e.n, 0)::int as enrollments
    from days
    left join by_signup s on s.day = days.day
    left join by_active a on a.day = days.day
    left join by_answer q on q.day = days.day
    left join by_done p on p.day = days.day
    left join by_course c on c.day = days.day
    left join by_enrol e on e.day = days.day
    order by days.day`);
}

/** Totals since launch, used by the page and the share cards. */
export async function getTotals() {
  const u = sql.raw('"user"');
  const [t] = await rows<Totals>(sql`
    select (select count(*) from "user")::int as learners,
           (select count(*) from "user" where ${paidSql(u)})::int as paying,
           (select coalesce(sum(watched_seconds), 0) from lesson_watch)::float8 as seconds,
           (select count(*) from lesson_watch where watched_at is not null)::int as watched,
           (select count(*) from lesson_progress)::int as completed,
           (select count(*) from attempt)::int as answers,
           (select count(*) from attempt where correct)::int as correct,
           (select count(*) from course where status = 'ready')::int as courses,
           (select count(distinct created_by) from course where status = 'ready')::int as builders,
           (select count(*) from enrollment)::int as enrollments,
           (select count(*) from roadmap)::int as roadmaps,
           (select coalesce(max(best), 0) from (${streaks()}) s)::int as longest,
           (select min(day) from user_day) as "firstDay"`);
  return t;
}

/** Weekly signup cohorts (by first visit), and the share who came back. A window that hasn't finished yet is null. */
const cohorts = () =>
  rows<Cohort>(sql`
    with f as (select user_id, min(day)::date as first from user_day group by user_id),
    c as (select user_id, first, date_trunc('week', first)::date as week from f where first >= date_trunc('week', current_date)::date - 7 * 7),
    r as (
      select c.week, c.first,
             exists (select 1 from user_day d where d.user_id = c.user_id and d.day::date = c.first + 1) as d1,
             exists (select 1 from user_day d where d.user_id = c.user_id and d.day::date between c.first + 1 and c.first + 7) as w1,
             exists (select 1 from user_day d where d.user_id = c.user_id and d.day::date between c.first + 8 and c.first + 14) as w2,
             exists (select 1 from user_day d where d.user_id = c.user_id and d.day::date between c.first + 22 and c.first + 28) as w4
      from c)
    select to_char(week, 'YYYY-MM-DD') as week, count(*)::int as size,
           (count(*) filter (where d1 and first + 1 < current_date))::float8 / nullif(count(*) filter (where first + 1 < current_date), 0) as d1,
           (count(*) filter (where w1 and first + 7 < current_date))::float8 / nullif(count(*) filter (where first + 7 < current_date), 0) as w1,
           (count(*) filter (where w2 and first + 14 < current_date))::float8 / nullif(count(*) filter (where first + 14 < current_date), 0) as w2,
           (count(*) filter (where w4 and first + 28 < current_date))::float8 / nullif(count(*) filter (where first + 28 < current_date), 0) as w4
    from r group by week order by week desc`);

/** The learners who carry CourseIt: top 5 by each measure. Builders are ranked by how many other people took their courses. */
const champions = () =>
  Promise.all([
    rows<Champ>(sql`select u.id, u.name, u.image, sum(w.watched_seconds)::float8 as value from lesson_watch w join "user" u on u.id = w.user_id group by u.id order by value desc limit 5`),
    rows<Champ>(sql`select u.id, u.name, u.image, count(*)::int as value from lesson_progress p join "user" u on u.id = p.user_id group by u.id order by value desc limit 5`),
    rows<Champ>(sql`select u.id, u.name, u.image, s.best as value from (${streaks()}) s join "user" u on u.id = s.user_id order by s.best desc, s.current desc limit 5`),
    rows<Champ>(sql`
      select u.id, u.name, u.image, count(*)::int as value
      from course c join enrollment e on e.course_id = c.id and e.user_id <> c.created_by join "user" u on u.id = c.created_by
      where c.status = 'ready' group by u.id order by value desc limit 5`),
  ]).then(([hours, lessons, streak, builders]) => ({ hours, lessons, streak, builders }));

export async function getStats(range: Range) {
  const today = daysAgo(0);
  const totals = await getTotals();
  const span = range === "all" ? null : Number(range);
  const from = span ? daysAgo(span - 1) : (totals.firstDay ?? today);
  const [now, prev, series, cohortRows, champs] = await Promise.all([
    period(from, today),
    span ? period(daysAgo(2 * span - 1), daysAgo(span)) : null,
    dailySeries(from),
    cohorts(),
    champions(),
  ]);
  const avgDaily = series.length ? series.reduce((t, d) => t + d.active, 0) / series.length : 0;
  return { range, from, today, totals, now, prev, series, avgDaily, cohorts: cohortRows, champs };
}
export type Stats = Awaited<ReturnType<typeof getStats>>;

// --- Share cards

/** 2 significant figures, rounded down, with a plus: 3083 → "3,000+", 865 → "860+". Under 100 stays exact. */
export const roundDown = (v: number) => {
  if (v < 100) return v.toLocaleString("en");
  const step = 10 ** (Math.floor(Math.log10(v)) - 1);
  return `${(Math.floor(v / step) * step).toLocaleString("en")}+`;
};

export const CARD_METRICS = {
  learners: { label: "learners", value: (t: Totals) => t.learners },
  hours: { label: "hours learned", value: (t: Totals) => Math.round(t.seconds / 3600) },
  lessons: { label: "lessons watched", value: (t: Totals) => t.watched },
  completed: { label: "lessons completed", value: (t: Totals) => t.completed },
  answers: { label: "quiz answers", value: (t: Totals) => t.answers },
  courses: { label: "courses built", value: (t: Totals) => t.courses },
  enrollments: { label: "course enrollments", value: (t: Totals) => t.enrollments },
  streak: { label: "day longest streak", value: (t: Totals) => t.longest },
} as const;
export type CardMetric = keyof typeof CARD_METRICS;
