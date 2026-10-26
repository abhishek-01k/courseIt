"use client";

import { useOptimistic, useTransition } from "react";
import { act } from "@/components/toaster";
import { cn } from "@/lib/utils";
import { setSkipAction } from "../actions";

// On = the lesson is in the learner's plan; off = skipped. Flips instantly, saves in the background.
export default function SkipSwitch({ courseId, lessonId, title, skipped }: { courseId: string; lessonId: string; title: string; skipped: boolean }) {
  const [, start] = useTransition();
  const [isSkipped, setOptimistic] = useOptimistic(skipped);
  const inPlan = !isSkipped;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={inPlan}
      aria-label={inPlan ? `Keep ${title} in my plan` : `Watch ${title} anyway`}
      onClick={() =>
        start(async () => {
          setOptimistic(!isSkipped);
          await act(() => setSkipAction(courseId, lessonId, !isSkipped), "Couldn't update your plan."); // the switch flips back by itself
        })
      }
      className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", inPlan ? "bg-moss" : "bg-ink/15")}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left]", inPlan ? "left-4.5" : "left-0.5")} />
    </button>
  );
}
