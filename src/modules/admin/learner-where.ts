import { type SQL, sql } from "drizzle-orm";
import { admins } from "@/lib/admin";
import type { LearnerFilter } from "./learner-filter";

/** YYYY-MM-DD, n days back (UTC, close enough across zones). */
export const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

/**
 * Each learner's current and best streak, from user_day (a "visit" day in their own timezone).
 * Streaks are islands of consecutive days; one still running ended today or yesterday (UTC, close enough).
 */
export const streaks = (where: SQL = sql`true`) => sql`
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

/** Same rule as hasPaidAccess in src/lib/billing.ts: on a paid plan, or cancelled but still in the paid period. */
export const paidSql = (u: SQL) =>
  sql`(${u}.plan <> 'free' and (${u}.plan_status in ('active', 'past_due') or (${u}.plan_status = 'cancelled' and ${u}.plan_renews_at > now())))`;

/** Lessons watched to 80% or finished (each lesson once). */
export const lessonsSql = (u: SQL) => sql`(select count(*) from (
  select w.lesson_id from lesson_watch w where w.user_id = ${u}.id and w.watched_at is not null
  union select p.lesson_id from lesson_progress p where p.user_id = ${u}.id) x)`;

/** Can be emailed: an address that hasn't bounced, and product news switched on. */
export const emailableSql = (u: SQL) => sql`(${u}.email is not null and ${u}.email_suppressed_at is null and ${u}.email_news)`;

const like = (q: string) => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/**
 * The learner filter as a WHERE clause on the "user" table. `u` is how the query names that table:
 * "user" in a Drizzle query on `users`, or an alias such as u in raw SQL. Every value is a bound parameter.
 */
export function learnerWhere(f: LearnerFilter, u: SQL = sql`"user"`): SQL {
  const all: SQL[] = [];
  if (f.q) all.push(sql`(${u}.name ilike ${like(f.q)} or ${u}.email ilike ${like(f.q)})`);
  if (f.plan === "paid") all.push(paidSql(u));
  else if (f.plan === "unpaid") all.push(sql`not ${paidSql(u)}`);
  else if (f.plan) all.push(sql`(${u}.plan = ${f.plan} and ${paidSql(u)})`);
  if (f.learned) {
    const since = sql`now() - make_interval(days => ${f.learned})`;
    all.push(sql`(exists (select 1 from lesson_watch w where w.user_id = ${u}.id and w.watched_seconds > 0 and w.updated_at > ${since})
      or exists (select 1 from attempt a where a.user_id = ${u}.id and a.created_at > ${since}))`);
  }
  if (f.away) all.push(sql`(select max(d.day) from user_day d where d.user_id = ${u}.id) <= ${daysAgo(f.away)}`);
  if (f.joinedFrom) all.push(sql`${u}.created_at >= ${f.joinedFrom}::date`);
  if (f.joinedTo) all.push(sql`${u}.created_at < ${f.joinedTo}::date + 1`);
  if (f.minDays) all.push(sql`(select count(*) from user_day d where d.user_id = ${u}.id) >= ${f.minDays}`);
  if (f.minLessons) all.push(sql`${lessonsSql(u)} >= ${f.minLessons}`);
  if (f.minHours) all.push(sql`(select coalesce(sum(w.watched_seconds), 0) from lesson_watch w where w.user_id = ${u}.id) >= ${f.minHours * 3600}`);
  if (f.minStreak) all.push(sql`coalesce((select s.current from (${streaks(sql`user_id = ${u}.id`)}) s), 0) >= ${f.minStreak}`);
  if (f.built) all.push(sql`${sql.raw(f.built === "yes" ? "" : "not ")}exists (select 1 from course c where c.created_by = ${u}.id)`);
  if (f.course) all.push(sql`exists (select 1 from enrollment e where e.user_id = ${u}.id and e.course_id = ${f.course})`);
  if (f.email) all.push(emailableSql(u));
  if (f.admins) {
    const list = admins();
    all.push(list.length ? sql`lower(${u}.email) in (${sql.join(list.map((e) => sql`${e}`), sql`, `)})` : sql`false`);
  }
  return all.length ? sql.join(all, sql` and `) : sql`true`;
}
