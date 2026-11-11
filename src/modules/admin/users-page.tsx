import { Download, Megaphone } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";
import LearnersFilterForm from "./components/learners-filter-form";
import { Avatar, hours, href, n, Pager, pageParam, param, type Params, pct, type SearchParams, SortHeader, table, tableWrap, td, tr } from "./components/ui";
import { filterLabel, filterParams, isEmpty, parseFilter } from "./learner-filter";
import { courseTitle, getAdminUsers, PAGE_SIZE, USER_SORTS, type UserSort } from "./queries";

const PLAN_LABEL = { free: "Free", basic: "Basic", pro: "Pro", max: "Max" } as const;

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
  const filter = parseFilter(sp);
  const sortParam = param(sp, "sort");
  const sort: UserSort = sortParam in USER_SORTS ? (sortParam as UserSort) : "active";
  const page = pageParam(sp);
  const [{ list, total, emails }, title] = await Promise.all([getAdminUsers({ filter, sort, page }), courseTitle(filter.course)]);
  const keep = { ...filterParams(filter), sort: sort === "active" ? undefined : sort };
  const link = (p: Params) => href("/admin/users", { ...keep, ...p });
  const filtered = !isEmpty(filter);
  const action = cn(buttonVariants({ variant: "outline" }), "gap-2");

  return (
    <>
      <LearnersFilterForm key={JSON.stringify(filter)} initial={filter} sort={keep.sort} courseTitle={title} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="min-w-0 flex-1 text-[0.92rem]">
          <strong className="font-medium tabular-nums">{n(total)}</strong> {total === 1 ? "learner" : "learners"}
          {filtered && <span className="text-ink-soft"> · {filterLabel(filter, title)}</span>}
          <span className="text-ink-soft"> · {n(emails)} can be emailed</span>
        </p>
        <a href={href("/admin/users/export", keep)} className={action}>
          <Download aria-hidden="true" className="size-4" /> Export CSV
        </a>
        <Link href={href("/admin/announcements", filterParams(filter))} className={action}>
          <Megaphone aria-hidden="true" className="size-4" /> Message {filtered ? "these" : "everyone"}
        </Link>
      </div>
      {list.length ? (
        <div className={tableWrap}>
          <table className={table}>
            <caption className="sr-only">Learners, sorted by {COLUMNS.find((c) => c.key === sort)?.label}</caption>
            <thead className="text-[0.82rem]">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-left font-medium text-ink-soft">
                  Learner
                </th>
                <th scope="col" className="px-3 py-2.5 text-left font-medium text-ink-soft">
                  Plan
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
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {u.paid ? (
                      <span className="rounded-full bg-lime-soft px-2.5 py-0.5 text-[0.78rem] font-medium text-pill-ink">{PLAN_LABEL[u.plan]}</span>
                    ) : (
                      <span className="text-[0.85rem] text-ink-soft">{u.plan === "free" ? "Free" : `${PLAN_LABEL[u.plan]} (lapsed)`}</span>
                    )}
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
        <p className="text-ink-soft">{filtered ? "No learner matches these filters." : "No learners yet."}</p>
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
