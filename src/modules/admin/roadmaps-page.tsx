import Link from "next/link";
import { Suspense } from "react";
import StatusBadge from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin";
import { roadmapPath } from "@/lib/paths";
import { timeAgo } from "@/lib/utils";
import { Chips, href, n, Pager, pageParam, param, type Params, type SearchParams, SearchBox, table, tableWrap, td, tr } from "./components/ui";
import { getAdminRoadmaps, PAGE_SIZE } from "./queries";

async function Roadmaps({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp, "q");
  const showParam = param(sp, "show");
  const show = showParam === "published" || showParam === "private" ? showParam : undefined;
  const page = pageParam(sp);
  const { list, total } = await getAdminRoadmaps({ q, show, page });
  const link = (p: Params) => href("/admin/roadmaps", { q, show, ...p });

  return (
    <>
      <SearchBox action="/admin/roadmaps" q={q} label="Search by title or owner…" keep={{ show }} />
      <Chips
        items={[
          { label: "All", href: link({ show: undefined, page: undefined }), active: !show },
          { label: "In Community", href: link({ show: "published", page: undefined }), active: show === "published" },
          { label: "Private", href: link({ show: "private", page: undefined }), active: show === "private" },
        ]}
      />
      {list.length ? (
        <div className={tableWrap}>
          <table className={`${table} min-w-[720px]`}>
            <caption className="sr-only">Roadmaps, most followed first</caption>
            <thead className="text-[0.82rem] text-ink-soft">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-left font-medium">
                  Roadmap
                </th>
                {["Owner", "Stages", "Courses", "Followers", "Updated"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2.5 text-right font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className={tr}>
                  <td className="max-w-[340px] px-3 py-2">
                    <span className="flex items-center gap-2">
                      <Link href={roadmapPath(r.slug)} className="truncate font-medium hover:underline">
                        {r.title}
                      </Link>
                      {r.published && <StatusBadge tone="ok">Community</StatusBadge>}
                    </span>
                  </td>
                  <td className={td}>
                    <Link href={`/admin/users/${r.ownerId}`} className="hover:underline">
                      {r.owner ?? "No name"}
                    </Link>
                  </td>
                  <td className={td}>{n(r.stages)}</td>
                  <td className={td}>{n(r.courses)}</td>
                  <td className={td}>{n(r.followers)}</td>
                  <td className={td}>{timeAgo(new Date(r.updated))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-ink-soft">{q || show ? "No roadmap matches these filters." : "No roadmaps yet."}</p>
      )}
      <Pager page={page} total={total} size={PAGE_SIZE} link={(p) => link({ page: p > 1 ? String(p) : undefined })} />
    </>
  );
}

export default function AdminRoadmapsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section aria-label="Roadmaps" className="flex flex-col gap-3.5">
      <p className="rounded-card bg-lime-soft px-5 py-4 text-[0.95rem] text-pill-ink">
        To add a roadmap to Community, make it in{" "}
        <Link href="/roadmaps" className="underline underline-offset-3">
          Roadmaps
        </Link>{" "}
        like any learner, then press “Publish to Community” on its page. Only admins see that button.
      </p>
      <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
        <Roadmaps searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
