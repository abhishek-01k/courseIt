import { redirect } from "next/navigation";
import { Suspense } from "react";
import PageHeader from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { buildBlock, paymentsLive, shortDate, usageFor } from "@/lib/billing";
import { formatHours } from "@/lib/plans";
import { currentRegion } from "@/lib/region";
import { buttonVariants } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { upgradeToMaxAction } from "./actions";
import PlanCards from "./components/plan-cards";

type Search = Promise<Record<string, string | string[] | undefined>>;

// /plans: pricing inside the app, for signed-in learners. New course and roadmaps send them here when a
// plan limit stops a build (?reason=limit|length); checkout comes back here if it's cancelled or fails.
async function Plans({ searchParams }: { searchParams: Search }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const [usage, params, region] = await Promise.all([usageFor(userId), searchParams, currentRegion()]);
  const { plan } = usage;

  const blocked = buildBlock(usage);
  const back = usage.hoursBackAt ? shortDate(usage.hoursBackAt) : null;
  const notice = !paymentsLive()
    ? `Pro and Max are coming soon. Until then, everyone gets a launch offer: one free course a month, up to ${plan.maxHours} hours long (a video, or a playlist adding up to ${plan.maxHours} hours).`
    : params.error === "checkout"
      ? "We couldn't open the checkout. Try again in a moment."
      : params.error === "upgrade"
        ? "We couldn't move you to Max, so nothing changed and nothing was charged. Check your card in Manage billing, or try again in a moment."
      : usage.unlimited
        ? null // no limits apply (admin), so a limit message would be wrong
        : params.reason === "limit" && blocked
        ? `${blocked.title}. ${blocked.detail} Courses others already built are still free to join.`
        : params.reason === "retry"
          ? "Retrying a course that didn't finish building is part of Pro and Max. Upgrade and Retry picks up where the build stopped, keeping every lesson already written."
          : params.reason === "hours"
            ? `That video needs more than the ${formatHours(usage.hoursLeft)} you have left this month on ${plan.name}. Upgrade for more hours, or pick a shorter video.`
            : params.reason === "length"
              ? `That video is longer than ${plan.name} allows (up to ${plan.maxHours} hours per course). Upgrade to build longer ones.`
              : null;

  return (
    <>
      {notice && (
        <p role="status" className="rounded-2xl bg-lime-soft px-4 py-3 text-[0.95rem] text-pill-ink">
          {notice}
        </p>
      )}
      {params.upgrade === "max" && plan.id === "pro" && usage.canManage && (
        <form action={upgradeToMaxAction} className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-[0_0_0_2px_var(--moss)]">
          <p className="text-[1.05rem] font-medium">Move to Max now?</p>
          <p className="text-[0.95rem] text-ink-soft">
            You get {PLANS.max.hoursPerMonth} hours a month and courses up to {PLANS.max.maxHours} hours straight away, on the same billing period.
            Your saved card is charged the difference for the rest of this period now; after that, Max renews at its usual price. If the payment
            doesn&apos;t go through, you stay on Pro and nothing is charged.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={buttonVariants({ size: "lg" })}>
              Upgrade to Max
            </button>
            <a href="/plans" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Not now
            </a>
          </div>
        </form>
      )}
      <p className="text-ink-soft">
        You&apos;re on <strong className="font-medium text-ink">{usage.admin ? "Admin · unlimited" : plan.name}</strong>
        {usage.unlimited
          ? ""
          : plan.coursesPerMonth
            ? `, with ${usage.coursesLeft} of ${plan.coursesPerMonth} free course${plan.coursesPerMonth === 1 ? "" : "s"} left this month${back ? ` (renews ${back})` : ""}`
            : `, with ${formatHours(usage.hoursLeft)} of ${plan.hoursPerMonth} hours left this month${back ? (plan.id === "free" ? ` (renews ${back})` : "") : ""}`}
        .
      </p>
      <div className="-mt-10">
        <PlanCards region={region} current={plan.id} live={paymentsLive()} />
      </div>
    </>
  );
}

export default function PlansPage({ searchParams }: { searchParams: Search }) {
  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6 px-4 pt-8 pb-20 sm:px-6">
      <PageHeader label="Plans" title="Build more," accent="learn more." />
      <Suspense fallback={<Skeleton className="h-[560px] rounded-card" />}>
        <Plans searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
