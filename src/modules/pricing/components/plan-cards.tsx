"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { type Interval, PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

const ORDER = [PLANS.free, PLANS.pro, PLANS.max];

export default function PlanCards() {
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
        {ORDER.map((plan) => {
          const featured = plan.id === "pro";
          const price = plan.price[interval];
          return (
            <li
              key={plan.id}
              className={cn(
                "flex flex-col gap-5 rounded-[24px] bg-surface p-6 shadow-[0_0_0_1px_var(--line)]",
                featured && "shadow-[0_0_0_2px_var(--moss)] md:-translate-y-2",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-h3 font-medium">{plan.name}</h2>
                {featured && <span className="rounded-full bg-lime-soft px-2.5 py-1 text-[0.75rem] font-medium text-moss">Most popular</span>}
              </div>
              <p className="-mt-3 text-[0.92rem] text-ink-soft">{plan.tagline}</p>
              <p className="flex items-baseline gap-1.5">
                <span className="font-display text-[2.6rem] leading-none tabular-nums">${price}</span>
                <span className="text-ink-soft">{price === 0 ? "forever" : interval === "month" ? "/ month" : "/ year"}</span>
              </p>
              <p className="rounded-2xl bg-lime-soft/60 px-4 py-3 text-[0.95rem]">
                <strong className="font-semibold">
                  {plan.coursesPerMonth} new {plan.coursesPerMonth === 1 ? "course" : "courses"}
                </strong>{" "}
                a month, up to {plan.maxHours} hours each
              </p>
              <ul className="flex flex-1 flex-col gap-2.5 text-[0.95rem]">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-moss" />
                    {perk}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.id === "free" ? "/new" : `/api/billing/checkout?plan=${plan.id}&interval=${interval}`}
                prefetch={false}
                className={buttonVariants({ size: "lg", variant: featured ? "default" : "outline", className: "w-full" })}
              >
                {plan.id === "free" ? "Start free" : `Get ${plan.name}`}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
