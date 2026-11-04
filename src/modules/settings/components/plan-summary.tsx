import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { usageFor } from "@/lib/billing";

const date = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// Settings → Plan: what they're on, how many builds are left, and where to change it.
export default async function PlanSummary() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const usage = await usageFor(userId);
  const { plan } = usage;
  const onHold = usage.status === "on_hold" || usage.status === "past_due";

  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-[1.1rem] font-medium">
          {usage.admin ? "Admin · unlimited" : plan.name}{" "}
          <span className="text-ink-soft">
            ·{" "}
            {usage.unlimited
              ? `${usage.used} new courses, ${usage.hoursUsed} hours in the last 30 days`
              : plan.lifetime
                ? usage.left > 0
                  ? "your free course is still to build"
                  : "free course used"
                : `${usage.used} of ${plan.coursesPerMonth} new courses, ${usage.hoursUsed} of ${plan.hoursPerMonth} hours in the last 30 days`}
          </span>
        </p>
        <p className="text-[0.92rem] text-ink-soft">
          {onHold
            ? "Your last payment didn't go through. Update your card in Manage billing to keep your plan."
            : usage.renewsAt
              ? usage.cancelsAtRenewal
                ? `Ends on ${date(usage.renewsAt)}. Your courses stay yours after that.`
                : `Renews on ${date(usage.renewsAt)}.`
              : `Up to ${plan.maxHours} hours per course. Joining courses others built is always free.`}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {plan.id !== "max" && !usage.unlimited && (
          <Link href="/plans" className={buttonVariants({ size: "lg" })}>
            Upgrade
          </Link>
        )}
        {usage.canManage && (
          <Link href="/api/billing/portal" prefetch={false} className={buttonVariants({ size: "lg", variant: "outline" })}>
            Manage billing
          </Link>
        )}
      </div>
    </div>
  );
}
