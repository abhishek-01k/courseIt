import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { getCourseSteps } from "../queries";

type Step = Awaited<ReturnType<typeof getCourseSteps>>[number];

const seconds = (from: Date, to: Date) => {
  const s = Math.max(0, Math.round((to.getTime() - from.getTime()) / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};

function StepIcon({ status }: { status: Step["status"] }) {
  if (status === "done") return <Check aria-hidden="true" className="size-4 text-ok-fg" />;
  if (status === "failed") return <X aria-hidden="true" className="size-4 text-err-fg" />;
  return <Loader2 aria-hidden="true" className="size-4 animate-spin text-moss motion-reduce:animate-none" />;
}

// Like Claude's thinking panel: the step running now on top, every step so far one click away.
export default function BuildStatus({ steps, now }: { steps: Step[]; now: Date }) {
  const running = steps.filter((s) => s.status === "running");
  const current = running.at(-1) ?? steps.at(-1);
  const lessonsDone = steps.filter((s) => s.key.startsWith("lesson:") && s.status === "done").length;
  const lessonsAll = steps.filter((s) => s.key.startsWith("lesson:")).length;

  return (
    <details className="group rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex size-6 shrink-0 items-center justify-center">
          {current ? <StepIcon status={current.status} /> : <Loader2 aria-hidden="true" className="size-4 animate-spin text-moss motion-reduce:animate-none" />}
        </span>
        <span className="min-w-0 flex-1" aria-live="polite">
          <span className="block truncate font-medium">{current?.label ?? "Starting…"}</span>
          {current && (
            <span className="block text-[0.85rem] text-ink-soft tabular-nums">
              {current.status === "running" ? `${seconds(current.startedAt, now)} so far` : current.detail}
              {running.length > 1 && ` · ${running.length} steps running at once`}
              {lessonsAll > 0 && ` · ${lessonsDone} of ${lessonsAll} lessons written`}
            </span>
          )}
        </span>
        <span className="hidden text-[0.85rem] text-ink-soft sm:inline">{steps.length} steps</span>
        <ChevronDown aria-hidden="true" className="size-4.5 shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
      </summary>

      <ol className="flex flex-col border-t px-5 py-2">
        {steps.map((step) => (
          <li key={step.key} className="flex items-start gap-3 py-2.5">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
              <StepIcon status={step.status} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-[0.92rem]", step.status === "running" && "font-medium")}>{step.label}</span>
              {step.detail && <span className="block text-[0.82rem] text-ink-soft">{step.detail}</span>}
            </span>
            <span className="shrink-0 font-mono text-label text-ink-soft tabular-nums">{seconds(step.startedAt, step.finishedAt ?? now)}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
