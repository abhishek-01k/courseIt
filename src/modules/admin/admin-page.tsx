import { Flame, PauseCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import StatusBadge from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin";
import { timeAgo } from "@/lib/utils";
import { DayBars } from "./components/charts";
import { Avatar, hours, n, pct, row, Section, Tiles } from "./components/ui";
import { getAdminOverview } from "./queries";

async function Overview() {
  await requireAdmin();
  const o = await getAdminOverview();
  const { learning: l, content: c, builds: b, streaks: s } = o;

  return (
    <>
      {b.paused && (
        <p role="status" className="flex items-center gap-2.5 rounded-card bg-warn-bg px-5 py-3.5 text-warn-fg">
          <PauseCircle aria-hidden="true" className="size-5 shrink-0" />
          Course builds are paused (PAUSE_COURSE_BUILDS=1). Learners can still open courses that are already built.
        </p>
      )}

      <Section title="People">
        <Tiles
          tiles={[
            { label: "Learners", value: o.people, note: o.neverVisited ? `${n(o.neverVisited)} signed up but never opened a page` : "all have visited" },
            { label: "New", value: o.signups.week, note: `${n(o.signups.today)} today · ${n(o.signups.month)} in 30 days` },
            { label: "Active today", value: o.active.day, note: `${n(o.active.week)} this week · ${n(o.active.month)} in 30 days` },
            { label: "Came back", value: pct(o.returnRate), note: "visited on 2 or more days" },
          ]}
        />
        <div className="grid gap-6 pt-2 md:grid-cols-2">
          <DayBars title="Active learners per day" unit="active" points={o.series.map((p) => ({ day: p.day, value: p.active }))} />
          <DayBars title="New learners per day" unit="new" points={o.series.map((p) => ({ day: p.day, value: p.signups }))} />
        </div>
        <p className="text-[0.8rem] text-ink-soft">Days are UTC. A learner counts as new on the first day they opened CourseIt.</p>
      </Section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Section title="Streaks">
          <Tiles
            tiles={[
              { label: "Running", value: s.running, note: "learners with a streak today" },
              { label: "Average", value: s.avg ? `${s.avg.toFixed(1)}d` : "—", note: "of the running ones" },
              { label: "Longest ever", value: s.longest ? `${s.longest}d` : "—" },
            ]}
          />
          {s.top.length ? (
            <ol className="flex flex-col gap-1.5">
              {s.top.map((u, i) => (
                <li key={u.id}>
                  <Link href={`/admin/users/${u.id}`} className={row}>
                    <span className="w-5 text-center text-[0.85rem] text-ink-soft tabular-nums">{i + 1}</span>
                    <Avatar name={u.name} image={u.image} size={28} />
                    <span className="min-w-0 flex-1 truncate font-medium">{u.name ?? "No name"}</span>
                    <span className="inline-flex items-center gap-1 text-[0.88rem] tabular-nums">
                      <Flame aria-hidden="true" className="size-4 text-moss" />
                      {u.current}d <span className="text-ink-soft">· best {u.best}d</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-ink-soft">No streaks running right now.</p>
          )}
        </Section>

        <Section title="Learning">
          <Tiles
            tiles={[
              { label: "Watched", value: hours(l.seconds), note: `${n(l.watched)} lessons watched to 80%` },
              { label: "Lessons done", value: l.completed, note: "every quiz question answered" },
              { label: "Quiz answers", value: l.answers, note: `${pct(l.answers ? l.correct / l.answers : null)} right` },
              { label: "Placement tests", value: l.placements, note: `average ${pct(l.placementAvg)} · ${n(l.skips)} lessons skipped` },
              { label: "Enrollments", value: l.enrollments, note: "learners × courses they take" },
              { label: "Notes", value: l.notes, note: "counted, never read" },
            ]}
          />
        </Section>
      </div>

      <Section title="Course builds">
        <Tiles
          tiles={[
            { label: "Courses", value: b.total, note: `${n(b.thisWeek)} built this week` },
            { label: "Ready", value: b.ready, note: b.total ? `${pct(b.ready / b.total)} of all` : undefined },
            { label: "In progress", value: b.queued + b.reading + b.building, note: `${n(b.queued)} queued · ${n(b.reading)} reading · ${n(b.building)} building` },
            { label: "Failed", value: b.failed, note: b.total ? `${pct(b.failed / b.total)} of all` : undefined },
            { label: "Build time", value: b.medianSeconds ? hours(b.medianSeconds) : "—", note: "median, start to finish" },
          ]}
        />
        <div className="grid gap-6 pt-1 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Building now</h3>
            {b.inFlight.length ? (
              <ul className="flex flex-col gap-1.5">
                {b.inFlight.map((x) => (
                  <li key={x.id}>
                    <Link href={`/admin/courses/${x.id}`} className={row}>
                      <span className="min-w-0 flex-1 truncate">{x.title}</span>
                      <StatusBadge tone="warn">
                        {x.status} · {x.progress}%
                      </StatusBadge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-soft">Nothing building.</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Latest failures</h3>
            {b.failures.length ? (
              <ul className="flex flex-col gap-1.5">
                {b.failures.map((x) => (
                  <li key={x.id}>
                    <Link href={`/admin/courses/${x.id}`} className={row}>
                      <span className="min-w-0 flex-1 truncate">{x.title}</span>
                      <span className="text-[0.82rem] text-ink-soft">
                        {x.creator ?? "Unknown"} · {timeAgo(x.createdAt)}
                      </span>
                      {x.error && <span className="w-full truncate text-[0.82rem] text-err-fg">{x.error}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-soft">No failed builds.</p>
            )}
          </div>
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Content">
          <Tiles
            tiles={[
              { label: "Videos", value: c.videos, note: `${hours(c.videoSeconds)} of video` },
              { label: "Lessons", value: c.lessons, note: `${n(c.questions)} quiz questions` },
              { label: "Creators", value: c.channels, note: `${n(c.placementQuestions)} placement questions` },
            ]}
          />
        </Section>
        <Section title="Roadmaps">
          <Tiles
            tiles={[
              { label: "Made", value: l.roadmaps, note: `${n(l.published)} in Community` },
              { label: "Follows", value: l.follows, note: "learners following a roadmap" },
            ]}
          />
        </Section>
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[640px] rounded-card" />}>
      <Overview />
    </Suspense>
  );
}
