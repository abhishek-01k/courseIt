"use client";

import { useState } from "react";
import { PACE_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function PacePicker() {
  const [minutes, setMinutes] = useState(30);
  const finishBy = PACE_OPTIONS.find((option) => option.minutes === minutes)?.finishBy;

  return (
    <div>
      <div role="group" aria-label="Minutes per day" className="flex gap-1.5">
        {PACE_OPTIONS.map((option) => (
          <button
            key={option.minutes}
            type="button"
            aria-pressed={option.minutes === minutes}
            onClick={() => setMinutes(option.minutes)}
            className={cn(
              "h-11 rounded-full px-3.5 text-[0.88rem] font-medium transition-colors",
              option.minutes === minutes ? "bg-moss text-on-moss" : "shadow-[inset_0_0_0_1px_var(--line)] hover:bg-muted"
            )}
          >
            {option.minutes} min
          </button>
        ))}
      </div>
      <p className="mt-[18px] font-display text-[2.4rem] leading-[1.05] tracking-[-0.02em] tabular-nums">Done by {finishBy}</p>
    </div>
  );
}
