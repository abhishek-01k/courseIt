"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Side = { time: string; days: number; lessons: number };

// "Full course / My course": the same course before and after skipping what you know.
export default function PlanCompare({ full, mine, total, minutesPerDay }: { full: Side; mine: Side; total: number; minutesPerDay: number }) {
  const [view, setView] = useState<"mine" | "full">("mine");
  const shown = view === "mine" ? mine : full;
  const tab = (active: boolean) => cn("min-h-10 rounded-full px-4 text-[0.88rem] font-medium transition-colors", active ? "bg-moss text-on-moss" : "text-ink-soft hover:text-ink");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[0.92rem] text-ink-soft">{minutesPerDay} min a day</span>
        <div role="radiogroup" aria-label="Compare plans" className="inline-flex gap-1 rounded-full bg-paper p-1 shadow-[0_0_0_1px_var(--line)]">
          <button type="button" role="radio" aria-checked={view === "full"} onClick={() => setView("full")} className={tab(view === "full")}>
            Full course
          </button>
          <button type="button" role="radio" aria-checked={view === "mine"} onClick={() => setView("mine")} className={tab(view === "mine")}>
            My course
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-baseline gap-4" aria-live="polite">
        {view === "mine" && full.time !== mine.time && <span className="font-display text-[1.8rem] text-ink-soft line-through opacity-60 tabular-nums">{full.time}</span>}
        <span className={cn("font-display text-[clamp(3.6rem,8vw,5.6rem)] leading-[0.9] tracking-[-0.045em] tabular-nums", view === "mine" ? "text-moss" : "text-ink")}>{shown.time}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[`${shown.days} ${shown.days === 1 ? "day" : "days"}`, `${shown.lessons} of ${total} lessons`].map((t) => (
          <span key={t} className="rounded-full bg-lime-soft px-3 py-1.5 font-mono text-label tracking-[0.07em] text-pill-ink uppercase tabular-nums">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
