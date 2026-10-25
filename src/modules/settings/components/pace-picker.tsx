"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setDailyMinutesAction } from "../actions";

const PRESETS = [30, 60, 90, 120];

// Daily learning time, for all courses. Changing it re-packs every course's days at once; nothing is regenerated.
export default function PacePicker({ minutesPerDay }: { minutesPerDay: number }) {
  const [custom, setCustom] = useState(!PRESETS.includes(minutesPerDay));
  const [value, setValue] = useState(String(minutesPerDay));
  const [pending, start] = useTransition();
  const choose = (minutes: number) => start(() => setDailyMinutesAction(minutes));

  const chip = (active: boolean) =>
    cn(
      "min-h-11 rounded-full px-4 text-[0.9rem] font-medium transition-colors",
      active ? "bg-moss text-on-moss" : "shadow-[inset_0_0_0_1px_var(--line)] hover:bg-lime-soft/50",
    );

  return (
    <div className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)]" aria-busy={pending}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">How much time do you have each day?</p>
        <span className="text-[0.9rem] text-ink-soft tabular-nums">{minutesPerDay} min a day</span>
      </div>
      <div role="radiogroup" aria-label="Minutes a day" className="flex flex-wrap gap-2">
        <button type="button" role="radio" aria-checked={custom} onClick={() => setCustom(true)} className={chip(custom)}>
          Custom
        </button>
        {PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={!custom && minutesPerDay === m}
            onClick={() => {
              setCustom(false);
              setValue(String(m));
              choose(m);
            }}
            className={chip(!custom && minutesPerDay === m)}
          >
            {m} min
          </button>
        ))}
      </div>
      {custom && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const minutes = Number(value);
            if (minutes >= 5 && minutes <= 480) choose(minutes);
          }}
        >
          <label htmlFor="custom-pace" className="text-[0.9rem] text-ink-soft">
            Minutes a day
          </label>
          <input
            id="custom-pace"
            type="number"
            inputMode="numeric"
            min={5}
            max={480}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-11 w-24 rounded-xl bg-paper px-3 text-ink shadow-[inset_0_0_0_1px_var(--line)] outline-none focus-visible:ring-2 focus-visible:ring-dusk"
          />
          <Button type="submit" size="lg" variant="outline" disabled={pending}>
            Set pace
          </Button>
        </form>
      )}
    </div>
  );
}
