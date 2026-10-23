import { Pause } from "lucide-react";
import { LogoMark } from "@/components/layout";
import StatusBadge from "@/components/status-badge";
import { TOUR_STEPS } from "@/lib/constants";
import TiltFrame from "./tilt-frame";

// ponytail: static tour screen; swap the body for the 45-second <video> once the tour is recorded.
// Width is capped by the viewport height so the whole 16:9 screen fits on screen once it settles.
export default function ProductPreview() {
  return (
    <section aria-label="Product tour" className="relative z-20 -mt-[230px] px-6">
      <TiltFrame className="mx-auto flex aspect-video w-[min(100%,calc((100vh-140px)*16/9))] max-w-[1200px] flex-col overflow-hidden rounded-panel bg-tour shadow-[0_0_0_6px_var(--surface),0_40px_80px_-30px_rgba(22,49,92,0.5)] max-md:aspect-auto max-md:w-full">
        <div className="flex flex-wrap items-center gap-3 border-b bg-surface px-[22px] py-3.5">
          <span className="inline-flex items-center gap-1.5 font-display text-[0.95rem] font-medium">
            <LogoMark className="h-[15px] w-5" />
            courseit
          </span>
          <span className="text-[0.88rem] text-ink-soft">React from zero · placement result</span>
          <StatusBadge tone="warn" className="ml-auto">
            7-day streak
          </StatusBadge>
        </div>

        <div className="grid min-h-0 flex-1 items-center gap-7 p-[clamp(20px,3.5vw,44px)] pb-3 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Step 2 · Placement test</span>
            <p className="font-display text-[clamp(2rem,3.6vw,2.8rem)] leading-[1.08] tracking-[-0.02em]">
              You already know <em className="italic text-moss">9 of 14 topics.</em>
            </p>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="ok">JSX</StatusBadge>
              <StatusBadge tone="ok">Props</StatusBadge>
              <StatusBadge tone="ok">Events</StatusBadge>
              <StatusBadge tone="warn">useEffect</StatusBadge>
              <StatusBadge tone="warn">Context</StatusBadge>
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-card bg-surface p-7 shadow-[0_0_0_1px_var(--line)]">
            <span className="font-display text-[1.6rem] text-ink-soft tabular-nums line-through opacity-60">6h 02m</span>
            <span className="font-display text-[clamp(4rem,8vw,6.4rem)] leading-[0.9] tracking-[-0.045em] text-moss tabular-nums">2h 40m</span>
            <span className="mt-1.5 text-[0.95rem] text-ink-soft">6 days at 30 minutes a day</span>
          </div>
        </div>

        <div className="flex items-center gap-4 px-[clamp(20px,3.5vw,44px)] pt-3.5 pb-[clamp(18px,2.5vw,30px)]">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-moss text-on-moss">
            <Pause className="size-3.5 fill-current" />
          </span>
          <ol className="flex min-w-0 flex-1 gap-2">
            {TOUR_STEPS.map((step) => (
              <li key={step.id} className="min-w-0 flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-lime-soft">
                  <div className="h-full rounded-full bg-moss" style={{ width: `${step.progress}%` }} />
                </div>
                <span className="mt-2 hidden truncate text-[0.78rem] text-ink-soft lg:block">{step.label}</span>
              </li>
            ))}
          </ol>
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft tabular-nums">0:14 / 0:45</span>
        </div>
      </TiltFrame>
    </section>
  );
}
