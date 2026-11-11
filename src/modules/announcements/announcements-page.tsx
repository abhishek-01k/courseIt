import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";
import type { SearchParams } from "@/modules/admin/components/ui";
import { filterLabel, parseFilter } from "@/modules/admin/learner-filter";
import { countLearners, courseTitle } from "@/modules/admin/queries";
import AnnouncementForm from "./components/announcement-form";
import { listAnnouncements } from "./queries";

export const card = "flex flex-col gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)]";
const date = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// Opened from Learners ("Message these"), the filter comes along in the URL.
async function NewForm({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const filter = parseFilter(await searchParams);
  const [reach, title] = await Promise.all([countLearners(filter), courseTitle(filter.course)]);
  return <AnnouncementForm key={JSON.stringify(filter)} id={null} filter={filter} reach={reach} courseTitle={title} />;
}

async function List() {
  await requireAdmin();
  const list = await listAnnouncements();
  if (!list.length) return <p className="text-[0.92rem] text-ink-soft">Nothing sent yet.</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {list.map((a) => (
        <li key={a.id}>
          <Link href={`/admin/announcements/${a.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] bg-paper px-3.5 py-2.5 hover:bg-lime-soft/40">
            <span className="min-w-0 flex-1 truncate font-medium">{a.subject}</span>
            <span className="max-w-[45%] truncate text-[0.85rem] text-ink-soft">{filterLabel(a.filter)}</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium",
                a.status === "sent" ? "bg-lime-soft text-moss" : a.status === "sending" ? "bg-warn-bg text-warn-fg" : "bg-ink/5 text-ink-soft",
              )}
            >
              {a.status === "sent" ? `Sent to ${a.recipients ?? 0}` : a.status === "sending" ? "Sending…" : "Draft"}
            </span>
            <span className="w-24 text-right text-[0.82rem] text-ink-soft tabular-nums">{date(a.sentAt ?? a.createdAt)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// Admin → Announcements: write once, send to any group of learners (a filter) by Inbox and email.
export default function AnnouncementsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section aria-labelledby="new-title" className={card}>
        <h2 id="new-title" className="text-h3 font-medium">
          New announcement
        </h2>
        <Suspense fallback={<Skeleton className="h-[520px] rounded-card" />}>
          <NewForm searchParams={searchParams} />
        </Suspense>
      </section>
      <section aria-labelledby="past-title" className={cn(card, "self-start")}>
        <h2 id="past-title" className="text-h3 font-medium">
          Sent and drafts
        </h2>
        <Suspense fallback={<Skeleton className="h-40 rounded-card" />}>
          <List />
        </Suspense>
      </section>
    </div>
  );
}
