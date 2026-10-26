import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import StatusBadge from "@/components/status-badge";
import Thumbnail from "@/components/thumbnail";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin";
import { coursePath, roadmapPath } from "@/lib/paths";
import { initials, timeAgo } from "@/lib/utils";
import { getAdminUser } from "./queries";

const card = "flex flex-col gap-3 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)]";
const row = "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] bg-paper p-2 pr-3 hover:bg-lime-soft/40";
const TONE = { ready: "ok", failed: "err" } as const;
const statusTone = (s: string) => TONE[s as keyof typeof TONE] ?? "warn";

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
    ["Days active", String(u.days)],
    ["Timezone", u.timezone ?? "—"],
    ["Daily time", `${u.minutesPerDay} min`],
    ["Notes · quiz answers", `${u.noteCount} · ${u.answerCount}`],
  ];

  return (
    <>
      <header className="flex flex-wrap items-center gap-4">
        <Thumbnail
          src={u.image}
          width={64}
          height={64}
          referrerPolicy="no-referrer"
          className="size-16 shrink-0 rounded-full"
          fallback={
            <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-lime-soft font-display text-[1.3rem] text-pill-ink">
              {initials(u.name)}
            </span>
          }
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Learner</span>
          <h1 className="truncate text-[clamp(1.8rem,4vw,2.4rem)] leading-[1.08]">{u.name ?? "No name"}</h1>
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

      <section aria-labelledby="taking-title" className={card}>
        <h2 id="taking-title" className="text-h3 font-medium">
          Enrolled courses <span className="text-ink-soft tabular-nums">{u.taking.length}</span>
        </h2>
        {u.taking.length ? (
          <ul className="flex flex-col gap-2">
            {u.taking.map((c) => (
              <li key={c.id}>
                <Link href={coursePath(c.slug)} className={row}>
                  <span className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-[10px] bg-lime-soft">
                    <Thumbnail src={c.thumbnail} fill sizes="64px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-[1_1_200px] truncate font-medium">{c.title}</span>
                  <span className="text-[0.85rem] text-ink-soft tabular-nums">
                    {c.pct}% done · opened {timeAgo(c.lastOpenedAt)} · enrolled {timeAgo(c.enrolledAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-soft">Not enrolled in any course.</p>
        )}
      </section>

      <section aria-labelledby="built-title" className={card}>
        <h2 id="built-title" className="text-h3 font-medium">
          Courses they built <span className="text-ink-soft tabular-nums">{u.built.length}</span>
        </h2>
        {u.built.length ? (
          <ul className="flex flex-col gap-2">
            {u.built.map((c) => (
              <li key={c.id}>
                <Link href={coursePath(c.slug)} className={row}>
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
      </section>

      <section aria-labelledby="roadmaps-title" className={card}>
        <h2 id="roadmaps-title" className="text-h3 font-medium">
          Roadmaps
        </h2>
        {u.owned.length + u.enrolledIn.length ? (
          <ul className="flex flex-col gap-2">
            {[...u.owned.map((r) => ({ ...r, role: "Made" })), ...u.enrolledIn.map((r) => ({ ...r, role: "Enrolled" }))].map((r) => (
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
      </section>
    </>
  );
}

export default function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pt-8 pb-20 sm:px-6">
      <Link href="/admin" className="inline-flex items-center gap-2 self-start text-[0.9rem] text-ink-soft hover:text-ink">
        <ArrowLeft aria-hidden="true" className="size-4" />
        All learners
      </Link>
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <Learner params={params} />
      </Suspense>
    </div>
  );
}
