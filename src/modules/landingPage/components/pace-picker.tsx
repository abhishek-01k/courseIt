"use client";

import { useState } from "react";
import { PACE_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function PacePicker() {
  const [minutes, setMinutes] = useState(30);
  const finishBy = PACE_OPTIONS.find((option) => option.minutes === minutes)?.finishBy;

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Minutes per day" className="flex gap-2">
        {PACE_OPTIONS.map((option) => (
          <button
            key={option.minutes}
            type="button"
            aria-pressed={option.minutes === minutes}
            onClick={() => setMinutes(option.minutes)}
            className={cn(
              "h-11 rounded-full border px-4 text-sm transition-colors",
              option.minutes === minutes ? "border-primary bg-primary font-semibold text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {option.minutes} min
          </button>
        ))}
      </div>
      <p className="text-4xl font-semibold tracking-tighter">Done by {finishBy}</p>
    </div>
  );
}
