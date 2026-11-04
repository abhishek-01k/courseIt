import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin";
import { Avatar, hours, href, n, Pager, pageParam, param, type Params, pct, type SearchParams, SearchBox, SortHeader, table, tableWrap, td, tr } from "./components/ui";
import { getAdminUsers, PAGE_SIZE, USER_SORTS, type UserSort } from "./queries";

const COLUMNS: { key: UserSort; label: string }[] = [
  { key: "active", label: "Last active" },
  { key: "joined", label: "First seen" },
  { key: "days", label: "Days" },
  { key: "streak", label: "Streak" },
  { key: "best", label: "Best" },
  { key: "enrolled", label: "Taking" },
  { key: "built", label: "Built" },
  { key: "lessons", label: "Lessons" },
  { key: "watched", label: "Watched" },
  { key: "accuracy", label: "Quiz" },
];

async function Learners({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp, "q");
  const sortParam = param(sp, "sort");
  const sort: UserSort = sortParam in USER_SORTS ? (sortParam as UserSort) : "active";
  const page = pageParam(sp);
  const { list, total } = await getAdminUsers({ q, sort, page });
  const link = (p: Params) => href("/admin/users", { q, sort: sort === "active" ? undefined : sort, ...p });

  return (
    <>
      <SearchBox action="/admin/users" q={q} label="Search by name or email…" keep={{ sort: sort === "active" ? undefined : sort }} />
      {list.length ? (
        <div className={tableWrap}>
          <table className={table}>
            <caption className="sr-only">Learners, sorted by {COLUMNS.find((c) => c.key === sort)?.label}</caption>
            <thead className="text-[0.82rem]">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-left font-medium text-ink-soft">
                  Learner
                </th>
                {COLUMNS.map((c) => (
                  <SortHeader key={c.key} label={c.label} active={c.key === sort} link={link({ sort: c.key === "active" ? undefined : c.key, page: undefined })} />
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className={tr}>
                  <td className="max-w-[280px] px-3 py-2">
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2.5 hover:underline">
                      <Avatar name={u.name} image={u.image} size={30} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{u.name ?? "No name"}</span>
                        <span className="truncate text-[0.8rem] text-ink-soft">{u.email ?? u.providers ?? "No email shared"}</span>
                      </span>
                    </Link>
                  </td>
                  <td className={td}>{u.lastSeen ?? "never"}</td>
                  <td className={td}>{u.firstSeen ?? "—"}</td>
                  <td className={td}>{n(u.days)}</td>
                  <td className={td}>{u.streak ? `${u.streak}d` : "—"}</td>
                  <td className={td}>{u.best ? `${u.best}d` : "—"}</td>
                  <td className={td}>{n(u.enrolled)}</td>
                  <td className={td}>{n(u.built)}</td>
                  <td className={td}>{n(u.lessons)}</td>
                  <td className={td}>{u.watched ? hours(u.watched) : "—"}</td>
                  <td className={td} title={u.answers ? `${n(u.answers)} answers` : undefined}>
                    {pct(u.accuracy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-ink-soft">{q ? `No learner matches “${q}”.` : "No learners yet."}</p>
      )}
      <Pager page={page} total={total} size={PAGE_SIZE} link={(p) => link({ page: p > 1 ? String(p) : undefined })} />
      <p className="text-[0.8rem] text-ink-soft">
        Streak: days in a row they opened CourseIt, still running if their last visit was today or yesterday. Quiz: share of answers right.
      </p>
    </>
  );
}

export default function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section aria-label="Learners" className="flex flex-col gap-3.5">
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <Learners searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
