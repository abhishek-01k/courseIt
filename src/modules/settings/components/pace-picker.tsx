"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { act } from "@/components/toaster";
import { cn } from "@/lib/utils";
import { setDailyMinutesAction } from "../actions";

const PRESETS = [30, 60, 90, 120];

// Daily learning time, for all courses. Picking a pace only selects it; Save changes stores it and re-packs
// every course's days at once (nothing is regenerated).
export default function PacePicker({ minutesPerDay }: { minutesPerDay: number }) {
  const [custom, setCustom] = useState(!PRESETS.includes(minutesPerDay));
  const [value, setValue] = useState(String(minutesPerDay));
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const minutes = Number(value);
  const valid = Number.isInteger(minutes) && minutes >= 5 && minutes <= 480;
  const changed = valid && minutes !== minutesPerDay;
  const pick = (next: string) => {
    setValue(next);
    setSaved(false);
  };

  const chip = (active: boolean) =>
    cn(
      "min-h-11 rounded-full px-4 text-[0.9rem] font-medium transition-colors",
      active ? "bg-moss text-on-moss" : "shadow-[inset_0_0_0_1px_var(--line)] hover:bg-lime-soft/50",
    );

  return (
    <form
      className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)]"
      aria-busy={pending}
      onSubmit={(e) => {
        e.preventDefault();
        if (!changed) return;
        start(async () => {
          if ((await act(() => setDailyMinutesAction(minutes), "Couldn't save your daily time.")) !== null) setSaved(true);
        });
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">How much time do you have each day?</p>
        <span className="text-[0.9rem] text-ink-soft tabular-nums">Now: {minutesPerDay} min a day</span>
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
            aria-checked={!custom && minutes === m}
            onClick={() => {
              setCustom(false);
              pick(String(m));
            }}
            className={chip(!custom && minutes === m)}
          >
            {m} min
          </button>
        ))}
      </div>
      {custom && (
        <div className="flex flex-wrap items-center gap-2">
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
            onChange={(e) => pick(e.target.value)}
            aria-invalid={!valid}
            aria-describedby="custom-pace-hint"
            className="min-h-11 w-24 rounded-xl bg-paper px-3 text-ink shadow-[inset_0_0_0_1px_var(--line)] outline-none focus-visible:ring-2 focus-visible:ring-dusk"
          />
          <span id="custom-pace-hint" className={cn("text-[0.85rem]", valid ? "text-ink-soft" : "text-warn-fg")}>
            5 to 480 minutes
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        <Button type="submit" size="lg" disabled={!changed || pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <span aria-live="polite" className="text-[0.88rem] text-ink-soft">
          {pending ? null : saved && !changed ? (
            <span className="inline-flex items-center gap-1 text-ok-fg">
              <Check aria-hidden="true" className="size-4" /> Saved. Your course plans now use {minutesPerDay} min a day.
            </span>
          ) : changed ? (
            `Not saved yet: ${minutes} min a day`
          ) : null}
        </span>
      </div>
    </form>
  );
}
