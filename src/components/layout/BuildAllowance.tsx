import Link from "next/link";
import { auth } from "@/lib/auth";
import { buildBlock, shortDate, usageFor } from "@/lib/billing";
import { formatHours } from "@/lib/plans";
import { cn } from "@/lib/utils";

// Sidebar, above Explore: how many hours of video the learner can still build this month, so the limit is never a surprise.
// Hidden when the sidebar is collapsed and for admins (no limit).
export default async function BuildAllowance() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const usage = await usageFor(userId);
  if (usage.unlimited) return null;

  const { plan } = usage;
  const blocked = buildBlock(usage);
  // Launch offer: one course a month, so count courses rather than hours.
  const byCourse = !!plan.coursesPerMonth;
  const share = byCourse ? Math.min(1, usage.coursesUsed / plan.coursesPerMonth!) : Math.min(1, usage.hoursUsed / plan.hoursPerMonth);
  const back = usage.hoursBackAt ? shortDate(usage.hoursBackAt) : null;

  return (
    <Link
      href="/plans"
      className="mx-0.5 flex shrink-0 flex-col gap-2 rounded-[14px] bg-surface px-3 py-2.5 shadow-[0_0_0_1px_var(--line)] transition-colors hover:bg-lime-soft/50 group-data-[collapsed=true]/side:hidden"
    >
      <span className="flex items-baseline justify-between gap-2 text-[0.82rem]">
        <span className="font-medium whitespace-nowrap">{byCourse ? "Free course" : "Hours left"}</span>
        <span className="font-mono text-[0.75rem] whitespace-nowrap text-ink-soft tabular-nums">
          {byCourse ? `${usage.coursesLeft} / ${plan.coursesPerMonth} left` : `${formatHours(usage.hoursLeft)} / ${plan.hoursPerMonth}h`}
        </span>
      </span>
      <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-lime-soft">
        <span className={cn("block h-full rounded-full", blocked ? "bg-ink-soft/50" : "bg-moss")} style={{ width: `${share * 100}%` }} />
      </span>
      <span className="text-[0.75rem] text-ink-soft">
        {blocked
          ? blocked.upgrade
            ? "Upgrade to build more →"
            : byCourse
              ? back
                ? `Next free course on ${back}`
                : "Next free course next month"
              : back
              ? `Hours start coming back ${back}`
              : "Hours come back 30 days after each build"
          : plan.id === "free"
            ? `Courses up to ${plan.maxHours}h${back ? ` · renews ${back}` : ""}`
            : `Courses up to ${plan.maxHours}h each`}
      </span>
    </Link>
  );
}
