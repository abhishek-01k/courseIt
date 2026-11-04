import Link from "next/link";
import { Suspense } from "react";
import StatusBadge from "@/components/status-badge";
import Thumbnail from "@/components/thumbnail";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin";
import { formatDuration, timeAgo } from "@/lib/utils";
import { Chips, hours, href, n, Pager, pageParam, param, type Params, pct, type SearchParams, SearchBox, Section, SortHeader, statusTone, table, tableWrap, td, tr } from "./components/ui";
import { COURSE_SORTS, COURSE_STATUSES, type CourseSort, type CourseStatus, getAdminCourses, PAGE_SIZE } from "./queries";

const COLUMNS: { key: CourseSort | null; label: string }[] = [
  { key: null, label: "Status" },
  { key: "newest", label: "Built" },
  { key: "lessons", label: "Lessons" },
  { key: "learners", label: "Learners" },
  { key: "finished", label: "Finished" },
  { key: "accuracy", label: "Quiz" },
  { key: null, label: "Build time" },
];

async function Courses({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp, "q");
  const sortParam = param(sp, "sort");
  const sort: CourseSort = sortParam in COURSE_SORTS ? (sortParam as CourseSort) : "newest";
  const statusParam = param(sp, "status");
  const status = (COURSE_STATUSES as readonly string[]).includes(statusParam) ? (statusParam as CourseStatus) : undefined;
  const page = pageParam(sp);
  const { list, total, statuses, creators } = await getAdminCourses({ q, status, sort, page });
  const base = { q, status, sort: sort === "newest" ? undefined : sort };
  const link = (p: Params) => href("/admin/courses", { ...base, ...p });
  const all = Object.values(statuses).reduce((t, v) => t + (v ?? 0), 0);

  return (
    <>
      <Section title="Top creators">
        {creators.length ? (
          <ol className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {creators.map((c, i) => (
              <li key={c.channel} className="flex items-center gap-3 border-b border-line py-1.5 last:border-0">
                <span className="w-5 text-center text-[0.85rem] text-ink-soft tabular-nums">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{c.channel}</span>
                <span className="text-[0.85rem] text-ink-soft tabular-nums">
                  {n(c.learners)} learners · {n(c.courses)} {c.courses === 1 ? "course" : "courses"}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-ink-soft">No courses yet.</p>
        )}
      </Section>

      <SearchBox action="/admin/courses" q={q} label="Search by title or creator…" keep={{ status, sort: base.sort }} />
      <Chips
        items={[
          { label: "All", href: link({ status: undefined, page: undefined }), active: !status, count: all },
          ...COURSE_STATUSES.map((s) => ({ label: s, href: link({ status: s, page: undefined }), active: status === s, count: statuses[s] ?? 0 })),
        ]}
      />

      {list.length ? (
        <div className={tableWrap}>
          <table className={table}>
            <caption className="sr-only">Courses</caption>
            <thead className="text-[0.82rem]">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-left font-medium text-ink-soft">
                  Course
                </th>
                {COLUMNS.map((c) =>
                  c.key ? (
                    <SortHeader key={c.label} label={c.label} active={c.key === sort} link={link({ sort: c.key === "newest" ? undefined : c.key, page: undefined })} />
                  ) : (
                    <th key={c.label} scope="col" className="px-3 py-2.5 text-right font-medium whitespace-nowrap text-ink-soft">
                      {c.label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className={tr}>
                  <td className="max-w-[340px] px-3 py-2">
                    <Link href={`/admin/courses/${c.id}`} className="flex items-center gap-2.5 hover:underline">
                      <span className="relative aspect-video w-14 shrink-0 overflow-hidden rounded-[8px] bg-lime-soft">
                        <Thumbnail src={c.thumbnail} fill sizes="56px" className="object-cover" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{c.title}</span>
                        <span className="truncate text-[0.8rem] text-ink-soft">
                          {c.channel} · {c.sourceType} · {formatDuration(c.durationSeconds)} · by {c.creator ?? "deleted user"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className={td}>
                    <StatusBadge tone={statusTone(c.status)}>{c.status === "ready" || c.status === "failed" ? c.status : `${c.status} ${c.progress}%`}</StatusBadge>
                  </td>
                  <td className={td}>{timeAgo(new Date(c.created))}</td>
                  <td className={td}>{n(c.lessons)}</td>
                  <td className={td}>{n(c.learners)}</td>
                  <td className={td}>{c.learners ? `${n(c.finished)} · ${pct(c.finished / c.learners)}` : "—"}</td>
                  <td className={td} title={c.answers ? `${n(c.answers)} answers` : undefined}>
                    {pct(c.accuracy)}
                  </td>
                  <td className={td}>{c.buildSeconds ? hours(c.buildSeconds) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-ink-soft">{q || status ? "No course matches these filters." : "No courses yet."}</p>
      )}
      <Pager page={page} total={total} size={PAGE_SIZE} link={(p) => link({ page: p > 1 ? String(p) : undefined })} />
      <p className="text-[0.8rem] text-ink-soft">Finished: learners who watched or passed every lesson. Build time: first build step to last.</p>
    </>
  );
}

export default function AdminCoursesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section aria-label="Courses" className="flex flex-col gap-3.5">
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <Courses searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
