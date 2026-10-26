"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { act } from "@/components/toaster";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markLessonDoneAction } from "../actions";

// Marks the lesson done and moves on to the next one (or back to the course after the last).
export default function MarkComplete({ lessonId, done, nextHref, courseHref }: { lessonId: string; done: boolean; nextHref: string | null; courseHref: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (done) {
    return (
      <span className={cn(buttonVariants({ variant: "outline", size: "lg" }), "pointer-events-none text-ok-fg")}>
        <Check aria-hidden="true" />
        Completed
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          if ((await act(() => markLessonDoneAction(lessonId), "Couldn't mark the lesson as completed.")) === null) return;
          router.push(nextHref ?? courseHref);
        })
      }
      className={buttonVariants({ size: "lg" })}
    >
      {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden="true" />}
      Mark as completed
    </button>
  );
}
