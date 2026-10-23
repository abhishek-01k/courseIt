"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { LESSON_FORMATS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LessonFormat } from "@/types/format-toggle";

export default function FormatToggle() {
  const [format, setFormat] = useState<LessonFormat>("Video");

  return (
    <div>
      <div role="tablist" aria-label="Lesson format" className="inline-flex gap-1 rounded-full p-1 shadow-[inset_0_0_0_1px_var(--line)]">
        {LESSON_FORMATS.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={option === format}
            onClick={() => setFormat(option)}
            className={cn(
              "min-h-[38px] rounded-full px-4 text-[0.85rem] font-medium",
              option === format ? "bg-lime-soft text-pill-ink" : "text-ink-soft"
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {format === "Video" ? (
        <div className="relative mt-4 flex aspect-[2/1] items-center justify-center rounded-[14px] bg-[#16315c]">
          <span className="flex size-10 items-center justify-center rounded-full bg-white/20">
            <Play className="size-3.5 fill-[#fcfcfa] text-[#fcfcfa]" />
          </span>
          <div className="absolute inset-x-3 bottom-2.5 h-1.5 rounded-full bg-[#e4e9c6]">
            <div className="h-full w-[46%] rounded-full bg-[#4b5e1e]" />
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[14px] p-4 text-[0.85rem] shadow-[inset_0_0_0_1px_var(--line)]">
          <p className="font-display text-base font-medium">Effects, in plain words</p>
          <p className="mt-1.5 text-ink-soft">
            Effects run after the screen updates. Return a cleanup to undo them.{" "}
            <span className="rounded-full bg-lime-soft px-2 py-0.5 font-mono text-[0.68rem] text-pill-ink">▶ 08:15</span>
          </p>
        </div>
      )}
    </div>
  );
}
