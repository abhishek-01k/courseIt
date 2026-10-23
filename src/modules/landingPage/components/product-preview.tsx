import { Pause } from "lucide-react";
import { TOUR_STEPS } from "@/lib/constants";

// ponytail: static tour frame; swap it for the 45-second <video> once the tour is recorded.
export default function ProductPreview() {
  return (
    <section aria-label="Product tour" className="mx-auto w-full max-w-6xl px-6 pt-20">
      <div className="scroll-grow overflow-hidden rounded-2xl border-[6px] border-border bg-card shadow-2xl">
        <div className="flex aspect-video flex-col justify-between gap-6 bg-muted/50 p-6 sm:p-10">
          <div className="grid flex-1 items-center gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Step 2 · Placement test</span>
              <p className="text-3xl font-semibold leading-tight tracking-tighter sm:text-4xl">
                You already know <em className="font-serif font-normal italic text-primary">9 of 14</em> topics.
              </p>
              <div className="hidden flex-wrap gap-2 text-sm sm:flex">
                <span className="rounded-full bg-success-soft px-3 py-1 text-success">JSX</span>
                <span className="rounded-full bg-success-soft px-3 py-1 text-success">Props</span>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-primary">useEffect</span>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-primary">Context</span>
              </div>
            </div>
            <div className="hidden rounded-2xl border bg-card p-6 md:block">
              <p className="text-2xl tracking-tight text-faint line-through">6h 02m</p>
              <p className="text-7xl font-semibold leading-none tracking-tighter text-primary">2h 40m</p>
              <p className="mt-3 text-muted-foreground">6 days at 30 minutes a day</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <Pause className="size-3.5 fill-current" />
            </span>
            <ol className="flex flex-1 gap-1.5">
              {TOUR_STEPS.map((step) => (
                <li key={step.id} className="min-w-0 flex-1">
                  <div className="h-1 overflow-hidden rounded-full bg-border">
                    <div className="h-full bg-foreground" style={{ width: `${step.progress}%` }} />
                  </div>
                  <span className="mt-2 hidden truncate text-xs text-muted-foreground lg:block">{step.label}</span>
                </li>
              ))}
            </ol>
            <span className="font-mono text-xs text-muted-foreground">0:14 / 0:45</span>
          </div>
        </div>
      </div>
    </section>
  );
}
