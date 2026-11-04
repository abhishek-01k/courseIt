import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import StatusBadge from "@/components/status-badge";
import Thumbnail from "@/components/thumbnail";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin";
import { roadmapPath } from "@/lib/paths";
import { timeAgo } from "@/lib/utils";
import { ActivityCalendar } from "./components/charts";
import { Avatar, hours, n, pct, row, Section, statusTone, Tiles } from "./components/ui";
import { getAdminUser } from "./queries";

async function Learner({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const u = await getAdminUser(id);
  if (!u) notFound();

  const facts = [
    ["Email", u.email ?? "Not shared by the provider"],
    ["Signs in with", u.providers ?? "—"],
    ["First seen", u.firstSeen ?? "—"],
    ["Last active", u.lastSeen ?? "—"],
    ["Timezone", u.timezone ?? "—"],
    ["Daily time", `${u.minutesPerDay} min`],
  ];

  return (
    <>
      <header className="flex flex-wrap items-center gap-4">
        <Avatar name={u.name} image={u.image} size={64} />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Learner</span>
          <h2 className="truncate text-[clamp(1.6rem,3.6vw,2.2rem)] leading-[1.08]">{u.name ?? "No name"}</h2>
        </div>
      </header>

      <dl className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-3">
        {facts.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 rounded-card bg-surface px-4 py-3 shadow-[0_0_0_1px_var(--line)]">
            <dt className="text-[0.8rem] text-ink-soft">{label}</dt>
            <dd className="truncate font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <Tiles
        tiles={[
          { label: "Streak", value: u.streak.current ? `${u.streak.current}d` : "—", note: `best ${u.streak.best}d` },
          { label: "Days active", value: u.days },
          { label: "Watched", value: hours(u.seconds), note: `${n(u.lessons)} lessons done` },
          { label: "Quiz", value: pct(u.answers ? u.correct / u.answers : null), note: `${n(u.answers)} answers` },
          { label: "Skipped", value: u.skips, note: "lessons, from placement tests" },
          { label: "Notes", value: u.notes, note: "counted, never read" },
        ]}
      />

      <Section title="Activity">
        <ActivityCalendar days={u.activeDays} />
      </Section>

      <Section title="Enrolled courses" count={u.taking.length}>
        {u.taking.length ? (
          <ul className="flex flex-col gap-2">
            {u.taking.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/courses/${c.id}`} className={row}>
                  <span className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-[10px] bg-lime-soft">
                    <Thumbnail src={c.thumbnail} fill sizes="64px" className="object-cover" />
                  </span>
                  <span className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
                    <span className="truncate font-medium">{c.title}</span>
                    <span className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-line" aria-hidden="true">
                      <span className="block h-full rounded-full bg-moss" style={{ width: `${c.pct}%` }} />
                    </span>
                  </span>
                  <span className="text-[0.85rem] text-ink-soft tabular-nums">
                    {c.pct}% · {c.done}/{c.total} lessons{c.skipped ? ` · ${c.skipped} skipped` : ""} · {hours(c.seconds)} watched · quiz{" "}
                    {pct(c.answers ? c.correct / c.answers : null)}
                    {c.placement ? ` · placement ${c.placement.score}/${c.placement.total}` : ""}
                  </span>
                  <span className="w-full text-[0.8rem] text-ink-soft sm:w-auto">
                    opened {timeAgo(c.lastOpenedAt)} · enrolled {timeAgo(c.enrolledAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-soft">Not enrolled in any course.</p>
        )}
      </Section>

      <Section title="Courses they built" count={u.built.length}>
        {u.built.length ? (
          <ul className="flex flex-col gap-2">
            {u.built.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/courses/${c.id}`} className={row}>
                  <span className="min-w-0 flex-[1_1_200px] truncate font-medium">{c.title}</span>
                  <StatusBadge tone={statusTone(c.status)}>{c.status}</StatusBadge>
                  <span className="text-[0.85rem] text-ink-soft">{timeAgo(c.createdAt)}</span>
                  {c.error && <span className="w-full text-[0.82rem] text-err-fg">{c.error}</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-soft">Hasn&apos;t built a course.</p>
        )}
      </Section>

      <Section title="Roadmaps">
        {u.owned.length + u.following.length ? (
          <ul className="flex flex-col gap-2">
            {[...u.owned.map((r) => ({ ...r, role: "Made" })), ...u.following.map((r) => ({ ...r, role: "Following" }))].map((r) => (
              <li key={`${r.role}-${r.id}`}>
                <Link href={roadmapPath(r.slug)} className={row}>
                  <span className="min-w-0 flex-[1_1_200px] truncate font-medium">{r.title}</span>
                  <StatusBadge tone="idle">{r.role}</StatusBadge>
                  {r.published && <StatusBadge tone="ok">In Community</StatusBadge>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-soft">No roadmaps.</p>
        )}
      </Section>
    </>
  );
}

export default function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <Link href="/admin/users" className="inline-flex items-center gap-2 self-start text-[0.9rem] text-ink-soft hover:text-ink">
        <ArrowLeft aria-hidden="true" className="size-4" />
        All learners
      </Link>
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <Learner params={params} />
      </Suspense>
    </>
  );
}
