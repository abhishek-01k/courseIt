import { desc, eq } from "drizzle-orm";
import { Bell } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import MarkRead from "./components/mark-read";

function when(d: Date) {
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)} h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

// The latest 50 messages. Everything sent by email shows here too (src/inngest/send-email.ts).
async function Messages() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const list = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
  if (!list.length) return <EmptyState icon={Bell} title="Nothing here yet" text="When your course finishes building, or something changes with your plan, you'll hear about it here." />;

  return (
    <>
      <MarkRead />
      <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]">
        {list.map((n) => {
          const unread = !n.readAt;
          const content = (
            <>
              <span aria-hidden="true" className={cn("mt-2 size-2 shrink-0 rounded-full", unread ? "bg-moss" : "bg-transparent")} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className={cn("truncate", unread ? "font-semibold" : "font-medium")}>{n.title}</span>
                  <span className="shrink-0 text-[0.8rem] text-ink-soft">{when(n.createdAt)}</span>
                </span>
                <span className="text-[0.92rem] text-ink-soft">{n.body}</span>
              </span>
            </>
          );
          const row = cn("flex gap-3 px-5 py-4", unread && "bg-lime-soft/30");
          return (
            <li key={n.id}>
              {n.href ? (
                <Link href={n.href} prefetch={n.href.startsWith("/api/") ? false : undefined} className={cn(row, "transition-colors hover:bg-lime-soft/50")}>
                  {unread && <span className="sr-only">Unread: </span>}
                  {content}
                </Link>
              ) : (
                <div className={row}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function InboxPage() {
  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-8 px-4 pt-8 pb-20 sm:px-6">
      <PageHeader label="Inbox" title="What's" accent="new for you." />
      <Suspense fallback={<Skeleton className="h-64 rounded-card" />}>
        <Messages />
      </Suspense>
    </div>
  );
}
