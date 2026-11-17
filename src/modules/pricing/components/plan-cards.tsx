"use client";

import { Check, CircleCheck, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  FREE_BUILDS_OPEN,
  formatPrice,
  type Interval,
  isUpgrade,
  LAUNCH_OFFER,
  onSale,
  perMonth,
  PLANS,
  type PlanId,
  REGIONS,
  type Region,
  SALE,
  salePrice,
  yearlySaving,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

// Before payments are live, the Free card shows the launch offer everyone actually gets. No Free card while it's paused.
const plansFor = (live: boolean) => [...(!live ? [LAUNCH_OFFER] : FREE_BUILDS_OPEN ? [PLANS.free] : []), PLANS.basic, PLANS.pro, PLANS.max];

// Each line is something the product does today; keep them true (refunds: src/modules/legal/refunds-page.tsx,
// renewal reminders: src/inngest/renewal-reminders.ts, uncounted failed builds: usageFor in src/lib/billing.ts,
// joining an existing course: startCourse in src/modules/course/start.ts).
const TRUST = ["Existing courses don't use hours", "Failed builds don't use hours", "Cancel any time"];

// `region`: whose prices to show (see src/lib/region.ts). `current`: the signed-in learner's plan (on /plans); its
// button turns into a label. The public page leaves it out.
// `live`: false until payments are switched on (paymentsLive in src/lib/billing.ts); paid plans then say "Coming soon".
// `sale`: whether SALE (src/lib/plans.ts) is on; decided on the server, which reads the clock per request.
// Yearly is picked first: the per-month price is the big number, with what's billed once a year right under it.
export default function PlanCards({ region, current, live, sale = false }: { region: Region; current?: PlanId; live: boolean; sale?: boolean }) {
  const [interval, setBillingInterval] = useState<Interval>("year");
  const plans = plansFor(live);
  // The Yearly button's badge: the biggest saving on offer, as an amount or a percentage (REGIONS[region].savings).
  const yearly = plans.filter((p) => !p.monthlyOnly && p.price[region].year > 0).map((p) => yearlySaving(p, region));
  const best = REGIONS[region].savings === "amount" ? formatPrice(Math.max(0, ...yearly.map((s) => s.amount)), region) : `${Math.max(0, ...yearly.map((s) => s.percent))}%`;
  const saleOn = sale && live;

  return (
    <div className="mt-10 flex w-full flex-col items-center gap-6">
      <div role="radiogroup" aria-label="Billing period" className="inline-flex flex-wrap justify-center gap-1 rounded-full bg-surface p-1 shadow-[0_0_0_1px_var(--line)]">
        {(["month", "year"] as const).map((value) => {
          const picked = interval === value;
          // In the sale, Monthly gets a small round "40% OFF" sticker on its top-left corner, like the Pro and Max cards.
          const badge = value === "year" && yearly.length ? `Save up to ${best}` : null;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={picked}
              onClick={() => setBillingInterval(value)}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.9rem] font-medium transition-colors",
                picked ? "bg-ink text-paper" : "text-ink-soft hover:text-ink",
              )}
            >
              {value === "month" ? "Monthly" : "Yearly"}
              {value === "month" && saleOn && (
                <span className="pointer-events-none absolute -top-4 -left-3 flex size-[34px] -rotate-12 flex-col items-center justify-center rounded-full bg-lime leading-none text-ink shadow-[0_0_0_2px_var(--surface)]">
                  <span className="text-[0.66rem] font-bold tabular-nums">{SALE.percent}%</span>
                  <span className="text-[0.5rem] font-bold tracking-wide">OFF</span>
                </span>
              )}
              {badge && (
                <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[0.75rem] font-semibold", picked ? "bg-lime text-ink" : "bg-lime-soft text-moss")}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      <ul className={cn("grid w-full gap-4 md:grid-cols-2", plans.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {plans.map((plan) => {
          const featured = plan.id === "pro";
          // A monthly-only plan keeps its monthly price when the toggle is on Yearly.
          const billed = plan.monthlyOnly ? "month" : interval;
          const monthly = plan.price[region].month;
          const price = plan.price[region][billed];
          const discounted = saleOn && onSale(true, plan.id, billed);
          // The big number is always a month: the yearly price spread over twelve, or the sale's first month.
          const shown = billed === "year" ? perMonth(price, region) : discounted ? salePrice(monthly) : monthly;
          // The line above it: what it's compared with, crossed out, and why it's lower. Monthly without the sale: the
          // early-user price next to the price it goes up to later.
          const saving = billed === "year" ? yearlySaving(plan, region) : null;
          const compare = saving
            ? { was: monthly, tag: REGIONS[region].savings === "amount" ? `Save ${formatPrice(saving.amount, region)} a year` : `Save ${saving.percent}%`, hot: true }
            : discounted
              ? { was: monthly, tag: `${SALE.name} price`, hot: true }
              : plan.laterPrice
                ? { was: plan.laterPrice[region], tag: "Early-user price", hot: false }
                : null;
          // The line under it: what is actually charged, so nobody is surprised by their statement.
          const charged =
            price === 0
              ? null
              : billed === "year"
                ? `Billed yearly at ${formatPrice(price, region)} · ${REGIONS[region].taxNote}`
                : discounted
                  ? `First month, then ${formatPrice(monthly, region)}/month · ${REGIONS[region].taxNote}`
                  : `${plan.monthlyOnly && interval === "year" ? "Monthly only · " : ""}${REGIONS[region].taxNote}`;
          return (
            <li
              key={plan.id}
              className={cn(
                "relative flex flex-col gap-5 rounded-[24px] bg-surface p-6 shadow-[0_0_0_1px_var(--line)]",
                featured && "shadow-[0_0_0_2px_var(--moss)]",
              )}
            >
              {/* The sale sticker, on the card's top-right corner. The header row makes room for it. */}
              {discounted && (
                <span className="absolute -top-4 -right-3 flex size-[68px] rotate-12 flex-col items-center justify-center rounded-full bg-lime leading-none text-ink shadow-[0_0_0_3px_var(--surface),0_10px_20px_-10px_rgba(22,49,92,0.5)]">
                  <span className="font-display text-[1.35rem] font-semibold tabular-nums">{SALE.percent}%</span>
                  <span className="text-[0.7rem] font-semibold tracking-wider">OFF</span>
                </span>
              )}
              <div className={cn("flex items-center justify-between gap-2", discounted && "mr-12")}>
                <h2 className="text-h3 font-medium">{plan.name}</h2>
                {featured && <span className="rounded-full bg-lime-soft px-2.5 py-1 text-[0.75rem] font-medium text-moss">Most popular</span>}
              </div>
              <p className="-mt-3 text-[0.92rem] text-ink-soft">{plan.tagline}</p>
              {/* Plans with nothing to compare keep an empty line so every card's price lines up. */}
              <p aria-hidden={!compare} className={cn("-mb-3 flex items-center gap-2 text-[0.85rem]", !compare && "invisible")}>
                <s className="text-ink-soft tabular-nums">
                  <span className="sr-only">{billed === "year" || discounted ? "Usual monthly price: " : "Later price: "}</span>
                  {compare ? formatPrice(compare.was, region) : "–"}
                </s>
                <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5", compare?.hot ? "bg-lime font-semibold text-ink" : "bg-lime-soft font-medium text-moss")}>
                  {compare?.tag ?? "–"}
                </span>
              </p>
              <p className="flex items-baseline gap-1.5">
                <span className="font-display text-[2.6rem] leading-none tabular-nums">{formatPrice(shown, region)}</span>
                <span className="text-ink-soft">{price === 0 ? "forever" : "/ month"}</span>
              </p>
              {/* Free keeps an empty line here so every card's hours box lines up. */}
              <p aria-hidden={!charged} className={cn("-mt-4 text-[0.8rem] text-ink-soft", !charged && "invisible")}>
                {charged ?? "–"}
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
              ) : current && isUpgrade(current, plan.id) ? (
                // A full page load: the in-app router can serve /plans from its 30s cache without the confirm panel.
                <a href={`/plans?upgrade=${plan.id}`} className={buttonVariants({ size: "lg", className: "w-full" })}>
                  Upgrade to {plan.name}
                </a>
              ) : (
              <Link
                href={plan.id === "free" ? "/new" : `/api/billing/checkout?plan=${plan.id}&interval=${billed}`}
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
