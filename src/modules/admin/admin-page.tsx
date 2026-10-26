import { Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import PageHeader from "@/components/page-header";
import Thumbnail from "@/components/thumbnail";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin";
import { initials } from "@/lib/utils";
import { getAdminStats, getAdminUsers } from "./queries";

type Search = Promise<Record<string, string | string[] | undefined>>;

const tile = "flex flex-col gap-1 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)]";
const n = (v: number) => v.toLocaleString("en");

async function Stats() {
  await requireAdmin();
  const s = await getAdminStats();
  const tiles = [
    { label: "Learners", value: s.people, note: `${n(s.active)} active in the last 7 days` },
    { label: "Courses built", value: s.courseCount, note: `${n(s.ready)} ready · ${n(s.building)} building · ${n(s.failed)} failed` },
    { label: "Enrollments", value: s.taken, note: "learners × courses they take" },
    { label: "Roadmaps", value: s.made, note: `${n(s.published)} in Community` },
  ];
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-[18px]">
      {tiles.map((t) => (
        <li key={t.label} className={tile}>
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">{t.label}</span>
          <span className="font-display text-stat leading-none tabular-nums">{n(t.value)}</span>
          <span className="text-[0.85rem] text-ink-soft tabular-nums">{t.note}</span>
        </li>
      ))}
    </ul>
  );
}

async function Users({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 80);
  const people = await getAdminUsers(query);
  return (
    <>
      <form action="/admin" className="flex min-h-12 items-center gap-2.5 rounded-full bg-surface px-4 text-ink-soft shadow-[0_0_0_1px_var(--line)] focus-within:ring-2 focus-within:ring-dusk">
        <Search aria-hidden="true" className="size-[18px] shrink-0" />
        <label htmlFor="admin-search" className="sr-only">
          Search learners
        </label>
        <input key={query} id="admin-search" type="search" name="q" defaultValue={query} placeholder="Search by name or email…" className="min-w-0 flex-1 bg-transparent text-ink outline-none" />
      </form>
      {people.length ? (
        <ul className="flex flex-col gap-2">
          {people.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/users/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card bg-surface px-4 py-3 shadow-[0_0_0_1px_var(--line)] hover:bg-lime-soft/40">
                <Thumbnail
                  src={p.image}
                  width={36}
                  height={36}
                  referrerPolicy="no-referrer"
                  className="size-9 shrink-0 rounded-full"
                  fallback={
                    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime-soft font-display text-[0.8rem] text-pill-ink">
                      {initials(p.name)}
                    </span>
                  }
                />
                <span className="flex min-w-0 flex-[1_1_220px] flex-col">
                  <span className="truncate font-medium">{p.name ?? "No name"}</span>
                  <span className="truncate text-[0.85rem] text-ink-soft">{p.email ?? "No email shared"}</span>
                </span>
                <span className="text-[0.85rem] text-ink-soft tabular-nums">
                  {p.providers ?? "—"} · {p.courses} {p.courses === 1 ? "course" : "courses"} · {p.roadmaps} {p.roadmaps === 1 ? "roadmap" : "roadmaps"} · last active {p.lastSeen ?? "never"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-soft">{query ? `No learner matches “${query}”.` : "No learners yet."}</p>
      )}
    </>
  );
}

export default function AdminPage({ searchParams }: { searchParams: Search }) {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-4 pt-8 pb-20 sm:px-6">
      <PageHeader label="Admin" title="Everything on" accent="CourseIt." />
      <Suspense fallback={<Skeleton className="h-32 rounded-card" />}>
        <Stats />
      </Suspense>

      <section aria-labelledby="community-title" className="flex flex-col gap-2 rounded-card bg-lime-soft px-5 py-4 text-pill-ink">
        <h2 id="community-title" className="text-h3 font-medium">
          Community roadmaps
        </h2>
        <p className="text-[0.95rem]">
          Make a roadmap in{" "}
          <Link href="/roadmaps" className="underline underline-offset-3">
            Roadmaps
          </Link>{" "}
          like any learner, then press “Publish to Community” on its page. Only admins see that button.
        </p>
      </section>

      <section aria-labelledby="users-title" className="flex flex-col gap-3.5">
        <h2 id="users-title" className="text-[1.6rem]">
          Learners
        </h2>
        <Suspense fallback={<Skeleton className="h-64 rounded-card" />}>
          <Users searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}
