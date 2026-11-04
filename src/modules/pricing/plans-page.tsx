import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import PageHeader from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { paymentsLive, usageFor } from "@/lib/billing";
import { currentRegion } from "@/lib/region";
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

  const notice = !paymentsLive()
    ? "Pro and Max are coming soon. Until then, building courses has no monthly limit, so keep learning!"
    : params.error === "checkout"
      ? "We couldn't open the checkout. Try again in a moment."
      : params.reason === "limit" && plan.lifetime
        ? "You've used your free course. Upgrade to Pro or Max to build more. Courses others already built are still free to join."
        : params.reason === "limit"
        ? `You've built ${usage.used} of ${plan.coursesPerMonth} new ${plan.coursesPerMonth === 1 ? "course" : "courses"} this month on ${plan.name}. Upgrade to keep building. Courses others already built are still free to join.`
        : params.reason === "retry"
          ? "Retrying a course that didn't finish building is part of Pro and Max. Upgrade and Retry picks up where the build stopped, keeping every lesson already written."
          : params.reason === "hours"
          ? `That would go past the ${plan.hoursPerMonth} hours of video ${plan.name} includes each month (${usage.hoursUsed} used). Upgrade for more hours, or pick a shorter video.`
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
      <p className="text-ink-soft">
        You&apos;re on <strong className="font-medium text-ink">{usage.admin ? "Admin · unlimited" : plan.name}</strong>
        {usage.unlimited
          ? ""
          : plan.lifetime
            ? usage.left > 0
              ? ", with your free course still to build"
              : " and have used your free course"
            : `, with ${usage.left} of ${plan.coursesPerMonth} new ${plan.coursesPerMonth === 1 ? "course" : "courses"} and ${Math.floor(usage.hoursLeft * 10) / 10} of ${plan.hoursPerMonth} hours left this month`}
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
      <p className="text-[0.88rem] text-ink-soft">
        Prices follow your country: GST included in India, VAT included in the UK, and US dollars plus local taxes elsewhere. Payments go through Dodo Payments. Change or cancel any time from Settings → Manage billing;
        you keep your plan until the period you paid for ends. See the <Link href="/refunds" className="underline underline-offset-2">Refund policy</Link>.
      </p>
    </div>
  );
}
