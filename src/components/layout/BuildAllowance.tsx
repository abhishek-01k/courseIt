import Link from "next/link";
import { auth } from "@/lib/auth";
import { buildBlock, usageFor } from "@/lib/billing";
import { cn } from "@/lib/utils";

// Sidebar, above Explore: how many new courses the learner can still build, so the limit is never a surprise.
// Hidden when the sidebar is collapsed and for admins (no limit).
export default async function BuildAllowance() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const usage = await usageFor(userId);
  if (usage.unlimited) return null;

  const { plan } = usage;
  const blocked = buildBlock(usage);
  const total = plan.coursesPerMonth;
  const left = Math.max(0, usage.left);
  const share = total ? Math.min(1, usage.used / total) : 1;
  const hoursLeft = Math.floor(usage.hoursLeft * 10) / 10;

  return (
    <Link
      href="/plans"
      className="mx-0.5 flex shrink-0 flex-col gap-2 rounded-[14px] bg-surface px-3 py-2.5 shadow-[0_0_0_1px_var(--line)] transition-colors hover:bg-lime-soft/50 group-data-[collapsed=true]/side:hidden"
    >
      <span className="flex items-baseline justify-between gap-2 text-[0.82rem]">
        <span className="font-medium">{plan.lifetime ? "Free course" : `${plan.name} builds`}</span>
        <span className="font-mono text-[0.75rem] text-ink-soft tabular-nums">
          {left} / {total} left
        </span>
      </span>
      <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-lime-soft">
        <span className={cn("block h-full rounded-full", blocked ? "bg-ink-soft/50" : "bg-moss")} style={{ width: `${share * 100}%` }} />
      </span>
      <span className="text-[0.75rem] text-ink-soft">
        {blocked
          ? blocked.upgrade
            ? "Upgrade to build more →"
            : "A slot frees up 30 days after each build"
          : plan.lifetime
            ? `Up to ${plan.maxHours} hours long`
            : `${hoursLeft} of ${plan.hoursPerMonth} hours left this month`}
      </span>
    </Link>
  );
}
