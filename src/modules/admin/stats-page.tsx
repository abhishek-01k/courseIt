import { Download } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";
import { DayBars } from "./components/charts";
import ShareCards from "./components/share-cards";
import { Avatar, change, Chips, hours, href, n, pct, row, Section, type SearchParams, table, tableWrap, td, Tiles, tr } from "./components/ui";
import { DEFINITIONS, getStats, parseRange, RANGES, type Range } from "./stats-queries";

const week = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });

function Champions({ title, list, unit, sort }: { title: string; list: { id: string; name: string | null; image: string | null; value: number }[]; unit: (v: number) => string; sort?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-baseline justify-between gap-2 font-medium">
        {title}
        {sort && (
          <Link href={`/admin/users?sort=${sort}`} className="text-[0.82rem] font-normal text-ink-soft hover:text-ink hover:underline">
            all →
          </Link>
        )}
      </h3>
      {list.length ? (
        <ol className="flex flex-col gap-1">
          {list.map((u, i) => (
            <li key={u.id}>
              <Link href={`/admin/users/${u.id}`} className={row}>
                <span className="w-4 text-center text-[0.8rem] text-ink-soft tabular-nums">{i + 1}</span>
                <Avatar name={u.name} image={u.image} size={26} />
                <span className="min-w-0 flex-1 truncate text-[0.9rem] font-medium">{u.name ?? "No name"}</span>
                <span className="text-[0.85rem] tabular-nums">{unit(u.value)}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[0.88rem] text-ink-soft">Nobody yet.</p>
      )}
    </div>
  );
}

async function Stats({ range }: { range: Range }) {
  await requireAdmin();
  const s = await getStats(range);
  const { totals: t, now, prev } = s;
  const label = RANGES[range].toLowerCase();
  const stickiness = now.active ? s.avgDaily / now.active : null;

  return (
    <>
      <Section title="Since launch">
        <Tiles
          tiles={[
            { label: "Learners", value: t.learners, note: `${n(t.paying)} paying right now` },
            { label: "Hours learned", value: hours(t.seconds), note: `${n(t.watched)} lessons watched to 80%` },
            { label: "Lessons completed", value: t.completed, note: `${n(t.answers)} quiz answers, ${pct(t.answers ? t.correct / t.answers : null)} right` },
            { label: "Courses built", value: t.courses, note: `by ${n(t.builders)} learners · ${n(t.enrollments)} enrollments` },
          ]}
        />
      </Section>

      <Section title={RANGES[range]}>
        <Tiles
          tiles={[
            { label: "New learners", value: now.newLearners, change: change(now.newLearners, prev?.newLearners) },
            { label: "Active learners", value: now.active, change: change(now.active, prev?.active), note: `opened CourseIt ${label}` },
            { label: "Actually learning", value: now.learning, note: `${pct(now.active ? now.learning / now.active : null)} of active · watched or answered` },
            { label: "Average day", value: Math.round(s.avgDaily), note: stickiness == null ? "active learners" : range === "30" ? `active learners · DAU/MAU ${pct(stickiness)}` : `active learners · ${pct(stickiness)} of the period's` },
            { label: "Lessons completed", value: now.completed, change: change(now.completed, prev?.completed) },
            { label: "Quiz answers", value: now.answers, change: change(now.answers, prev?.answers) },
            { label: "Courses built", value: now.courses, change: change(now.courses, prev?.courses) },
            { label: "Enrollments", value: now.enrollments, change: change(now.enrollments, prev?.enrollments) },
          ]}
        />
        {prev && <p className="text-[0.8rem] text-ink-soft">Changes compare with the {s.series.length} days before. Watch time has no history by date, so it&apos;s only shown as a total.</p>}
        <div className="grid gap-6 pt-2 md:grid-cols-2">
          <DayBars title="Total learners" unit="learners" points={s.series.map((d) => ({ day: d.day, value: d.total }))} summary={`${n(s.series.at(-1)?.total ?? 0)} now`} />
          <DayBars
            title="Active learners per day"
            unit="active"
            points={s.series.map((d) => ({ day: d.day, value: d.active }))}
            summary={`peak ${n(Math.max(0, ...s.series.map((d) => d.active)))} · ${n(Math.round(s.avgDaily))} a day on average`}
          />
          <DayBars title="New learners per day" unit="new" points={s.series.map((d) => ({ day: d.day, value: d.signups }))} />
          <DayBars title="Quiz answers per day" unit="answers" points={s.series.map((d) => ({ day: d.day, value: d.answers }))} />
        </div>
      </Section>

      <Section title="Do they come back?">
        <p className="-mt-1 text-[0.88rem] text-ink-soft">Learners grouped by the week they first came in. Blank means that window hasn&apos;t finished yet.</p>
        <div className={tableWrap}>
          <table className={cn(table, "min-w-[560px]")}>
            <thead className="text-[0.82rem] text-ink-soft">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-left font-medium">
                  First week
                </th>
                {["Learners", "Next day", "Within 7 days", "Days 8–14", "Days 22–28"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2.5 text-right font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.cohorts.map((c) => (
                <tr key={c.week} className={tr}>
                  <td className="px-3 py-2.5">{week(c.week)}</td>
                  <td className={td}>{n(c.size)}</td>
                  {[c.d1, c.w1, c.w2, c.w4].map((v, i) => (
                    <td key={i} className={td} style={v == null ? undefined : { backgroundColor: `color-mix(in srgb, var(--moss) ${Math.round(v * 45)}%, transparent)` }}>
                      {v == null ? "" : pct(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Your champions">
        <p className="-mt-1 text-[0.88rem] text-ink-soft">The learners carrying CourseIt. Good people for a testimonial or a shout-out.</p>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <Champions title="Most hours learned" list={s.champs.hours} unit={hours} sort="watched" />
          <Champions title="Most lessons" list={s.champs.lessons} unit={(v) => n(v)} sort="lessons" />
          <Champions title="Longest streak" list={s.champs.streak} unit={(v) => `${v}d`} sort="best" />
          <Champions title="Courses others took" list={s.champs.builders} unit={(v) => `${n(v)} learners`} sort="built" />
        </div>
      </Section>

      <ShareCards range={range} />

      <Section title="What each number means">
        <dl className="grid gap-x-6 gap-y-2 text-[0.88rem] md:grid-cols-2">
          {DEFINITIONS.map((d) => (
            <div key={d.term}>
              <dt className="inline font-medium">{d.term}: </dt>
              <dd className="inline text-ink-soft">{d.text}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[0.8rem] text-ink-soft">Days are UTC. Admin accounts are counted like anyone else.</p>
      </Section>
    </>
  );
}

// Admin → Stats: the numbers for investors, grant forms and social posts, with exports.
export default async function AdminStatsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section aria-label="Stats" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Suspense fallback={<div className="h-9" />}>
          <RangeChips searchParams={searchParams} />
        </Suspense>
        <a href="/admin/stats/export" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
          <Download aria-hidden="true" className="size-4" /> Daily numbers (CSV)
        </a>
      </div>
      <Suspense fallback={<Skeleton className="h-[900px] rounded-card" />}>
        <StatsFor searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function RangeChips({ searchParams }: { searchParams: SearchParams }) {
  const range = parseRange((await searchParams).range as string | undefined);
  return <Chips items={(Object.keys(RANGES) as Range[]).map((r) => ({ label: RANGES[r], href: href("/admin/stats", { range: r === "30" ? undefined : r }), active: r === range }))} />;
}

async function StatsFor({ searchParams }: { searchParams: SearchParams }) {
  const range = parseRange((await searchParams).range as string | undefined);
  return <Stats range={range} />;
}
