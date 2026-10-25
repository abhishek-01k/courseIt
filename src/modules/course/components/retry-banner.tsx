import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { retryCourseAction } from "../actions";

// Shown when a build failed outright or finished with some lessons missing (usually a busy moment at Nebius).
export default function RetryBanner({ courseId, message }: { courseId: string; message: string }) {
  return (
    <form
      action={retryCourseAction.bind(null, courseId)}
      className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-warn-bg px-5 py-4 text-warn-fg"
    >
      <p className="text-[0.95rem]">{message}</p>
      <Button type="submit" size="lg">
        <RotateCcw aria-hidden="true" />
        Retry
      </Button>
    </form>
  );
}
