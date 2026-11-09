"use client";

import { Loader2, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { act } from "@/components/toaster";
import { Button, buttonVariants } from "@/components/ui/button";
import { retryCourseAction } from "../actions";

// Shown when a build failed outright or finished with some lessons missing (usually a busy moment at Nebius).
// Retrying comes with every paid plan: without one (`canRetry` false) the button links to the plans instead.
export default function RetryBanner({ courseId, message, canRetry }: { courseId: string; message: string; canRetry: boolean }) {
  const [pending, start] = useTransition();
  if (!canRetry) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-warn-bg px-5 py-4 text-warn-fg">
        <p className="text-[0.95rem]">{message.replace("Retry picks up", "On Pro, Retry picks up")}</p>
        <Link href="/plans?reason=retry" className={buttonVariants({ size: "lg", className: "gap-2" })}>
          <Sparkles aria-hidden="true" className="size-4" />
          Upgrade to retry
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-warn-bg px-5 py-4 text-warn-fg">
      <p className="text-[0.95rem]">{message}</p>
      <Button type="button" size="lg" disabled={pending} onClick={() => start(async () => void (await act(() => retryCourseAction(courseId), "Couldn't restart the build.")))}>
        {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <RotateCcw aria-hidden="true" />}
        Retry
      </Button>
    </div>
  );
}
