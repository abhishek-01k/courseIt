"use client";

import { Check, CircleCheck, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice, type Interval, LAUNCH_OFFER, PLANS, type PlanId, REGIONS, type Region } from "@/lib/plans";
import { cn } from "@/lib/utils";

// Before payments are live, the Free card shows the launch offer everyone actually gets.
const plansFor = (live: boolean) => [live ? PLANS.free : LAUNCH_OFFER, PLANS.pro, PLANS.max];

// Each line is something the product does today; keep them true (refunds: src/modules/legal/refunds-page.tsx,
// renewal reminders: src/inngest/renewal-reminders.ts, uncounted failed builds: usageFor in src/lib/billing.ts,
// joining an existing course: startCourse in src/modules/course/start.ts).
const TRUST = ["Existing courses don't use hours", "Failed builds don't use hours", "Cancel any time"];

// `region`: whose prices to show (see src/lib/region.ts). `current`: the signed-in learner's plan (on /plans); its
// button turns into a label. The public page leaves it out.
// `live`: false until payments are switched on (paymentsLive in src/lib/billing.ts); paid plans then say "Coming soon".
export default function PlanCards({ region, current, live }: { region: Region; current?: PlanId; live: boolean }) {
  const [interval, setBillingInterval] = useState<Interval>("month");

  return (
    <div className="mt-10 flex w-full flex-col items-center gap-8">
      <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full bg-surface p-1 shadow-[0_0_0_1px_var(--line)]">
        {(["month", "year"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={interval === value}
            onClick={() => setBillingInterval(value)}
            className={cn("rounded-full px-4 py-2 text-[0.9rem] font-medium transition-colors", interval === value ? "bg-ink text-paper" : "text-ink-soft hover:text-ink")}
          >
            {value === "month" ? "Monthly" : "Yearly · 2 months free"}
          </button>
        ))}
      </div>

      <ul className="grid w-full gap-4 md:grid-cols-3">
        {plansFor(live).map((plan) => {
          const featured = plan.id === "pro";
          const price = plan.price[region][interval];
          // Monthly only: the early-user price next to the price it goes up to later (yearly already shows its saving).
          const later = interval === "month" ? plan.laterPrice?.[region] : undefined;
          return (
            <li
              key={plan.id}
              className={cn(
                "flex flex-col gap-5 rounded-[24px] bg-surface p-6 shadow-[0_0_0_1px_var(--line)]",
                featured && "shadow-[0_0_0_2px_var(--moss)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-h3 font-medium">{plan.name}</h2>
                {featured && <span className="rounded-full bg-lime-soft px-2.5 py-1 text-[0.75rem] font-medium text-moss">Most popular</span>}
              </div>
              <p className="-mt-3 text-[0.92rem] text-ink-soft">{plan.tagline}</p>
              {/* Monthly: the price it goes up to later, crossed out. Free keeps an empty line so the prices line up. */}
              {interval === "month" && (
                <p aria-hidden={!later} className={cn("-mb-3 flex items-center gap-2 text-[0.85rem]", !later && "invisible")}>
                  <s className="text-ink-soft tabular-nums">
                    <span className="sr-only">Later price: </span>
                    {later ? formatPrice(later, region) : "–"}
                  </s>
                  <span className="whitespace-nowrap rounded-full bg-lime-soft px-2 py-0.5 font-medium text-moss">Early-user price</span>
                </p>
              )}
              <p className="flex items-baseline gap-1.5">
                <span className="font-display text-[2.6rem] leading-none tabular-nums">{formatPrice(price, region)}</span>
                <span className="text-ink-soft">{price === 0 ? "forever" : interval === "month" ? "/ month" : "/ year"}</span>
              </p>
              {/* Free keeps an empty line here so every card's hours box lines up. */}
              <p aria-hidden={price === 0} className={cn("-mt-4 text-[0.8rem] text-ink-soft", price === 0 && "invisible")}>
                {REGIONS[region].taxNote}
              </p>
              <div className="flex flex-col gap-0.5 rounded-2xl bg-lime-soft/60 px-4 py-3">
                <p className="text-[1.05rem]">
                  {plan.coursesPerMonth ? (
                    <>
                      <strong className="font-semibold">1 course</strong>/month · up to {plan.maxHours}h
                    </>
                  ) : (
                    <>
                      <strong className="font-semibold">{plan.hoursPerMonth} hours</strong>/month
                    </>
                  )}
                </p>
                {plan.launch && <p className="text-[0.8rem] text-ink-soft">Launch offer · {PLANS.free.hoursPerMonth}h/month once Pro opens</p>}
              </div>
              <ul className="flex flex-1 flex-col gap-2.5 text-[0.95rem]">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-moss" />
                    {perk}
                  </li>
                ))}
              </ul>
              {!live && plan.id !== "free" ? (
                <span className={buttonVariants({ size: "lg", variant: "outline", className: "pointer-events-none w-full opacity-70" })}>Coming soon</span>
              ) : current === plan.id ? (
                <span className={buttonVariants({ size: "lg", variant: "outline", className: "pointer-events-none w-full opacity-70" })}>Your plan</span>
              ) : current && plan.id === "free" ? (
                <Link href="/api/billing/portal" prefetch={false} className={buttonVariants({ size: "lg", variant: "outline", className: "w-full" })}>
                  Manage billing
                </Link>
              ) : current === "pro" && plan.id === "max" ? (
                // A full page load: the in-app router can serve /plans from its 30s cache without the confirm panel.
                <a href="/plans?upgrade=max" className={buttonVariants({ size: "lg", className: "w-full" })}>
                  Upgrade to Max
                </a>
              ) : (
              <Link
                href={plan.id === "free" ? "/new" : `/api/billing/checkout?plan=${plan.id}&interval=${interval}`}
                prefetch={false}
                className={buttonVariants({ size: "lg", variant: featured ? "default" : "outline", className: "w-full" })}
              >
                {plan.id === "free" ? "Start free" : `Get ${plan.name}`}
              </Link>
              )}
            </li>
          );
        })}
      </ul>

      <div className="w-full">
        <ul aria-label="Why it's safe to try" className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[0.95rem]">
          {TRUST.map((text) => (
            <li key={text} className="flex items-center gap-2">
              <CircleCheck aria-hidden="true" className="size-[18px] shrink-0 text-moss" />
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* One footer row, aligned to the cards' edges: terms on the left, checkout on the right. */}
      <div className="flex w-full flex-col items-center gap-2 border-t border-line pt-4 text-[0.8rem] text-ink-soft sm:flex-row sm:justify-between">
        <p className="text-center sm:text-left">
          By upgrading you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
            Privacy Policy
          </Link>
          . Refunds:{" "}
          <Link href="/refunds" className="underline underline-offset-2 hover:text-ink">
            Refund policy
          </Link>
          .
        </p>
        <p className="flex shrink-0 items-center gap-1.5">
          <Lock aria-hidden="true" className="size-3.5" />
          Secure checkout via Dodo Payments
        </p>
      </div>
    </div>
  );
}
