"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Kept in step with CARD_METRICS and CARD_SIZES (server side); this file can't import the database code.
const METRICS = {
  learners: "Learners",
  hours: "Hours learned",
  lessons: "Lessons watched",
  completed: "Lessons completed",
  answers: "Quiz answers",
  courses: "Courses built",
  enrollments: "Enrollments",
  streak: "Longest streak",
} as const;
const SIZES = { portrait: "Instagram post (1080×1350)", square: "Square (1080×1080)", story: "Story (1080×1920)", wide: "X / LinkedIn (1200×675)" } as const;

const check = "flex min-h-9 cursor-pointer items-center gap-2 rounded-full bg-paper px-3 text-[0.86rem] shadow-[inset_0_0_0_1px_var(--line)] has-checked:bg-lime-soft has-checked:text-pill-ink";

// Pick numbers and a size; the image is drawn on the server (/admin/stats/card) and downloads as a PNG.
export default function ShareCards({ range }: { range: string }) {
  const [metrics, setMetrics] = useState<string[]>(["learners", "hours", "lessons", "courses"]);
  const [size, setSize] = useState<keyof typeof SIZES>("portrait");
  const [round, setRound] = useState(true);
  const [title, setTitle] = useState("");
  const qs = new URLSearchParams({ m: metrics.join(","), size, ...(round && { round: "1" }), ...(title.trim() && { title: title.trim() }) });
  const src = `/admin/stats/card?${qs}`;
  const toggle = (m: string) => setMetrics((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : cur.length < 6 ? [...cur, m] : cur));

  return (
    <section aria-labelledby="share-title" className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)]">
      <h2 id="share-title" className="text-h3 font-medium">
        Share cards
      </h2>
      <p className="-mt-2 text-[0.88rem] text-ink-soft">
        Since-launch totals as an image for Instagram, X or a deck. Up to 6 numbers. Rounding turns 3,083 into 3,000+, so a post stays true for a while.
        {range !== "all" && " Cards always show since-launch totals."}
      </p>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[0.86rem] font-medium">Numbers</legend>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(METRICS).map(([k, l]) => (
                <label key={k} className={check}>
                  <input type="checkbox" checked={metrics.includes(k)} onChange={() => toggle(k)} className="accent-[var(--moss)]" />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex flex-col gap-1 text-[0.86rem] font-medium">
            Size
            <select value={size} onChange={(e) => setSize(e.target.value as keyof typeof SIZES)} className="min-h-10 rounded-xl bg-paper px-3 shadow-[inset_0_0_0_1px_var(--line)]">
              {Object.entries(SIZES).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[0.86rem] font-medium">
            Headline <span className="font-normal text-ink-soft">(optional)</span>
            <input
              value={title}
              maxLength={60}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="10 days since launch"
              className="min-h-10 rounded-xl bg-paper px-3 shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_2px_var(--moss)]"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-[0.9rem]">
            <input type="checkbox" checked={round} onChange={(e) => setRound(e.target.checked)} className="size-4 accent-[var(--moss)]" />
            Round down (3,083 → 3,000+)
          </label>
          <a
            href={`${src}&download=1`}
            download
            aria-disabled={!metrics.length}
            className={cn(buttonVariants({ size: "lg" }), "gap-2 self-start", !metrics.length && "pointer-events-none opacity-50")}
          >
            <Download aria-hidden="true" className="size-4" /> Download PNG
          </a>
        </div>
        {metrics.length ? (
          // eslint-disable-next-line @next/next/no-img-element -- a generated PNG from our own route, not a static asset
          <img src={src} alt="Preview of the share card" className="max-h-[520px] w-full rounded-[14px] bg-paper object-contain shadow-[0_0_0_1px_var(--line)]" />
        ) : (
          <p className="text-ink-soft">Pick at least one number.</p>
        )}
      </div>
    </section>
  );
}
