import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import StatusBadge from "@/components/status-badge";
import Thumbnail from "@/components/thumbnail";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin";
import { coursePath } from "@/lib/paths";
import { formatDuration, timeAgo } from "@/lib/utils";
import { Avatar, hours, n, pct, row, Section, statusTone, table, tableWrap, td, Tiles, tr } from "./components/ui";
import { getAdminCourse } from "./queries";

const STEP_TONE = { done: "ok", failed: "err", running: "warn" } as const;
const stepSeconds = (a: Date, b: Date | null) => (b ? Math.max(0, (b.getTime() - a.getTime()) / 1000) : null);

async function Course({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const c = await getAdminCourse(id);
  if (!c) notFound();

  return (
    <>
      <header className="flex flex-wrap items-center gap-4">
        <span className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-[14px] bg-lime-soft">
          <Thumbnail src={c.thumbnail} fill sizes="144px" className="object-cover" />
        </span>
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Course</span>
          <h2 className="text-[clamp(1.4rem,3vw,1.9rem)] leading-[1.12]">{c.title}</h2>
          <span className="flex flex-wrap items-center gap-2 text-[0.88rem] text-ink-soft">
            <StatusBadge tone={statusTone(c.status)}>{c.status === "ready" || c.status === "failed" ? c.status : `${c.status} ${c.progress}%`}</StatusBadge>
            {c.channel} · {c.sourceType} · {formatDuration(c.durationSeconds)} · built {timeAgo(new Date(c.created))} by{" "}
            {c.creatorId ? (
              <Link href={`/admin/users/${c.creatorId}`} className="underline underline-offset-3 hover:text-ink">
                {c.creator ?? "No name"}
              </Link>
            ) : (
              "a deleted user"
            )}
            <Link href={coursePath(c.slug)} className="inline-flex items-center gap-1 underline underline-offset-3 hover:text-ink">
              Open course <ExternalLink aria-hidden="true" className="size-3.5" />
            </Link>
          </span>
        </div>
      </header>

      {c.error && <p className="rounded-card bg-err-bg px-5 py-3.5 text-[0.92rem] text-err-fg">{c.error}</p>}

      <Tiles
        tiles={[
          { label: "Learners", value: c.learners },
          { label: "Finished", value: c.finished, note: c.learners ? `${pct(c.finished / c.learners)} of learners` : undefined },
          { label: "Lessons", value: c.lessons },
          { label: "Quiz", value: pct(c.accuracy), note: `${n(c.answers)} answers` },
          { label: "Placement", value: c.placement?.taken ?? 0, note: c.placement?.taken ? `average ${pct(c.placement.avg)}` : "tests taken" },
          { label: "Build time", value: c.buildSeconds ? hours(c.buildSeconds) : "—" },
        ]}
      />

      <Section title="Lessons" count={c.lessonRows.length}>
        {c.lessonRows.length ? (
          <div className={tableWrap}>
            <table className={`${table} min-w-[640px]`}>
              <caption className="sr-only">Lesson by lesson: how many learners watched, finished and skipped each one</caption>
              <thead className="text-[0.82rem] text-ink-soft">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-left font-medium">
                    Lesson
                  </th>
                  {["Watched", "Done", "Skipped", "Quiz"].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2.5 text-right font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.lessonRows.map((l) => (
                  <tr key={l.id} className={tr}>
                    <td className="max-w-[420px] truncate px-3 py-2">
                      <span className="mr-2 text-ink-soft tabular-nums">{l.position + 1}.</span>
                      {l.title}
                      {!l.ready && (
                        <StatusBadge tone="warn" className="ml-2">
                          building
                        </StatusBadge>
                      )}
                    </td>
                    <td className={td}>{n(l.watched)}</td>
                    <td className={td}>{n(l.completed)}</td>
                    <td className={td}>{n(l.skipped)}</td>
                    <td className={td} title={l.answers ? `${n(l.answers)} answers` : undefined}>
                      {pct(l.accuracy)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-ink-soft">No lessons yet.</p>
        )}
      </Section>

      <Section title="Learners" count={c.learners}>
        {c.people.length ? (
          <ul className="flex flex-col gap-1.5">
            {c.people.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className={row}>
                  <Avatar name={u.name} image={u.image} size={28} />
                  <span className="min-w-0 flex-[1_1_180px] truncate font-medium">{u.name ?? "No name"}</span>
                  <span className="text-[0.85rem] text-ink-soft tabular-nums">
                    {u.done}/{c.lessons} lessons · quiz {pct(u.accuracy)} · opened {timeAgo(new Date(u.opened))} · enrolled {timeAgo(new Date(u.enrolled))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-soft">Nobody is taking this course yet.</p>
        )}
        {c.learners > c.people.length && <p className="text-[0.8rem] text-ink-soft">Showing the 100 who opened it most recently.</p>}
        {c.learners > 0 && (
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-[0.9rem]">
            <Link href={`/admin/users?course=${id}`} className="font-medium text-moss hover:underline">
              Filter, sort or export these learners →
            </Link>
            <Link href={`/admin/announcements?course=${id}`} className="font-medium text-moss hover:underline">
              Message them →
            </Link>
          </p>
        )}
      </Section>

      <Section title="Build log" count={c.steps.length}>
        {c.steps.length ? (
          <ol className="flex flex-col gap-1.5">
            {c.steps.map((s) => {
              const secs = stepSeconds(s.startedAt, s.finishedAt);
              return (
                <li key={s.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] bg-paper px-3 py-2">
                  <StatusBadge tone={STEP_TONE[s.status]}>{s.status}</StatusBadge>
                  <span className="min-w-0 flex-[1_1_220px] truncate">{s.label}</span>
                  <span className="text-[0.82rem] text-ink-soft tabular-nums">{secs == null ? "running" : secs < 60 ? `${Math.round(secs)}s` : hours(secs)}</span>
                  {s.detail && <span className="w-full text-[0.82rem] text-ink-soft">{s.detail}</span>}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-ink-soft">No build steps logged.</p>
        )}
      </Section>
    </>
  );
}

export default function AdminCoursePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Link href="/admin/courses" className="inline-flex items-center gap-2 self-start text-[0.9rem] text-ink-soft hover:text-ink">
        <ArrowLeft aria-hidden="true" className="size-4" />
        All courses
      </Link>
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <Course params={params} />
      </Suspense>
    </>
  );
}
