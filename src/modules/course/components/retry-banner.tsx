"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useTransition } from "react";
import { act } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { retryCourseAction } from "../actions";

// Shown when a build failed outright or finished with some lessons missing (usually a busy moment at Nebius).
export default function RetryBanner({ courseId, message }: { courseId: string; message: string }) {
  const [pending, start] = useTransition();
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
