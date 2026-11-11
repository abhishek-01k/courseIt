// Who: one way to describe a group of learners, used by the Learners table, announcements and stats.
// Any combination works ("on Pro, learned this week, 3-day streak"), so a new group never needs new code.
// The keys double as URL params, so a filtered Learners view can be bookmarked or turned into an announcement.
// Safe to import from client components; the SQL lives in learner-where.ts.

export const PLANS = { paid: "Any paid plan", unpaid: "No paid plan", basic: "Basic", pro: "Pro", max: "Max" } as const;
export type PlanFilter = keyof typeof PLANS;

export type LearnerFilter = {
  q?: string; // name or email contains
  plan?: PlanFilter; // paid = has paid access right now (cancelled but still in the paid period counts)
  learned?: number; // watched part of a lesson or answered a quiz question in the last N days
  away?: number; // has opened CourseIt before, but not in the last N days
  joinedFrom?: string; // signed up on or after (YYYY-MM-DD)
  joinedTo?: string; // signed up on or before (YYYY-MM-DD)
  minDays?: number; // opened CourseIt on at least N days
  minLessons?: number; // at least N lessons watched to 80% or finished
  minHours?: number; // at least N hours of lessons watched
  minStreak?: number; // a streak of at least N days running now
  built?: "yes" | "no"; // has built a course
  course?: string; // taking this course (a course id)
  email?: "yes"; // can be emailed: has an address that hasn't bounced, and gets product news
  admins?: "yes"; // only the admins (a dry run)
};

const NUMBERS = ["learned", "away", "minDays", "minLessons", "minHours", "minStreak"] as const;
const DATES = ["joinedFrom", "joinedTo"] as const;
export const FILTER_KEYS = ["q", "plan", ...NUMBERS, ...DATES, "built", "course", "email", "admins"] as const satisfies readonly (keyof LearnerFilter)[];

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : Array.isArray(v) && typeof v[0] === "string" ? v[0] : typeof v === "number" ? String(v) : "").trim();

/** From URL params, form data or stored JSON: keeps only what's valid, so it's safe to build SQL from. */
export function parseFilter(raw: Raw | FormData | null | undefined): LearnerFilter {
  if (!raw) return {};
  const get = (k: string) => str(raw instanceof FormData ? raw.get(k) : raw[k]);
  const f: LearnerFilter = {};
  const q = get("q").slice(0, 80);
  if (q) f.q = q;
  const plan = get("plan");
  if (plan in PLANS) f.plan = plan as PlanFilter;
  for (const k of NUMBERS) {
    const v = Number.parseInt(get(k), 10);
    if (v > 0) f[k] = Math.min(v, 3650);
  }
  for (const k of DATES) {
    const v = get(k);
    if (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))) f[k] = v;
  }
  const built = get("built");
  if (built === "yes" || built === "no") f.built = built;
  const course = get("course");
  if (/^[\w-]{1,64}$/.test(course)) f.course = course;
  if (get("email") === "yes") f.email = "yes";
  if (get("admins") === "yes") f.admins = "yes";
  return f;
}

/** As URL params (strings), for links. */
export function filterParams(f: LearnerFilter): Record<string, string | undefined> {
  return Object.fromEntries(FILTER_KEYS.map((k) => [k, f[k] == null ? undefined : String(f[k])]));
}

export const isEmpty = (f: LearnerFilter) => FILTER_KEYS.every((k) => f[k] == null);
/** How many filters are on, not counting the search box. */
export const activeCount = (f: LearnerFilter) => FILTER_KEYS.filter((k) => k !== "q" && f[k] != null).length;

const days = (v: number) => (v === 1 ? "today" : `${v} days`);

/** In words, e.g. ["Pro", "learned in the last 7 days", "streak 3d+"]. Empty means everyone. */
export function describeFilter(f: LearnerFilter, courseTitle?: string | null): string[] {
  const out: string[] = [];
  if (f.admins) out.push("Admins only");
  if (f.plan) out.push(PLANS[f.plan]);
  if (f.learned) out.push(f.learned === 1 ? "learned today" : `learned in the last ${days(f.learned)}`);
  if (f.away) out.push(`away ${days(f.away)}+`);
  if (f.joinedFrom && f.joinedTo) out.push(`joined ${f.joinedFrom} to ${f.joinedTo}`);
  else if (f.joinedFrom) out.push(`joined since ${f.joinedFrom}`);
  else if (f.joinedTo) out.push(`joined by ${f.joinedTo}`);
  if (f.minDays) out.push(`${f.minDays}+ active days`);
  if (f.minLessons) out.push(`${f.minLessons}+ lessons`);
  if (f.minHours) out.push(`${f.minHours}h+ watched`);
  if (f.minStreak) out.push(`streak ${f.minStreak}d+`);
  if (f.built) out.push(f.built === "yes" ? "built a course" : "never built a course");
  if (f.course) out.push(`taking ${courseTitle ? `“${courseTitle}”` : "a course"}`);
  if (f.email) out.push("can be emailed");
  if (f.q) out.push(`matching “${f.q}”`);
  return out;
}

export const filterLabel = (f: LearnerFilter, courseTitle?: string | null) => {
  const parts = describeFilter(f, courseTitle);
  if (!parts.length) return "Everyone";
  const s = parts.join(" · ");
  return s[0].toUpperCase() + s.slice(1);
};

/** Starting points, not saved groups: each one just fills in the filter. */
export const PRESETS: { label: string; filter: LearnerFilter }[] = [
  { label: "Learned this week", filter: { learned: 7 } },
  { label: "Active learners (30d)", filter: { learned: 30 } },
  { label: "Paying", filter: { plan: "paid" } },
  { label: "No paid plan", filter: { plan: "unpaid" } },
  { label: "Gone quiet (14d+)", filter: { away: 14 } },
  { label: "On a streak (3d+)", filter: { minStreak: 3 } },
  { label: "Power learners (10+ lessons)", filter: { minLessons: 10 } },
  { label: "Course builders", filter: { built: "yes" } },
];

