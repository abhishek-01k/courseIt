"use client";

import { Check, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn, formatDuration } from "@/lib/utils";
import { coursePath, lessonPath } from "@/lib/paths";
import type { CoursePlan } from "@/modules/course/queries";

// Every lesson in the course, one day at a time: Day tabs on top (the day being watched is open),
// that day's lessons below. Scrolls to the one playing.
export default function Playlist({ slug, courseTitle, plan, currentId }: { slug: string; courseTitle: string; plan: CoursePlan; currentId: string }) {
  const box = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const items = plan.lessons;
  const current = items.find((l) => l.id === currentId);
  const days = [...new Set(items.map((l) => l.day))];
  const [day, setDay] = useState(current?.day ?? days[0] ?? 1);
  const shown = items.filter((l) => l.day === day);

  useEffect(() => {
    const el = box.current;
    const row = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el) el.scrollTop = row ? row.offsetTop - el.offsetTop - 8 : 0;
    tabs.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [currentId, day]);

  return (
    <section aria-label="Course lessons" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]">
      <header className="shrink-0 px-4 pt-3 pb-2.5">
        <Link href={coursePath(slug)} className="line-clamp-1 font-display text-[1.1rem] hover:underline">
          {courseTitle}
        </Link>
        <p className="text-[0.82rem] text-ink-soft tabular-nums">
          Lesson {(current?.position ?? 0) + 1} of {items.length} · {items.filter((l) => l.done).length} done
        </p>
      </header>

      <div ref={tabs} role="tablist" aria-label="Days" className="flex shrink-0 gap-1.5 overflow-x-auto border-b px-3 pb-2.5 [scrollbar-width:none]">
        {days.map((d) => {
          const list = items.filter((l) => l.day === d);
          const allDone = list.every((l) => l.done || l.skipped);
          const selected = d === day;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="day-lessons"
              onClick={() => setDay(d)}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[0.82rem] font-medium whitespace-nowrap transition-colors",
                selected ? "bg-moss text-on-moss" : "text-ink-soft shadow-[inset_0_0_0_1px_var(--line)] hover:text-ink",
              )}
            >
              {allDone && <Check aria-hidden="true" className="size-3.5" />}
              Day {d}
              {d === plan.today && (
                <>
                  <span aria-hidden="true" className={cn("size-1.5 rounded-full", selected ? "bg-on-moss" : "bg-moss")} />
                  <span className="sr-only">(today)</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div id="day-lessons" role="tabpanel" aria-label={`Day ${day}`} ref={box} className="relative max-h-[420px] min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 lg:max-h-none">
        {shown.map((l) => {
          const isCurrent = l.id === currentId;
          return (
            <Link
              key={l.id}
              href={lessonPath(slug, l.position)}
              aria-current={isCurrent ? "page" : undefined}
              className={cn("flex items-start gap-2.5 rounded-xl p-1.5 hover:bg-lime-soft/40", isCurrent && "bg-lime-soft hover:bg-lime-soft")}
            >
              <span className="w-5 shrink-0 pt-4 text-center text-[0.75rem] text-ink-soft tabular-nums">
                {isCurrent ? <Play aria-hidden="true" className="mx-auto size-3 fill-moss text-moss" /> : l.position + 1}
              </span>
              <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-lime-soft">
                {l.thumbnail && <Image src={l.thumbnail} alt="" fill sizes="96px" className="object-cover" />}
                <span className="absolute right-0.5 bottom-0.5 rounded bg-black/75 px-1 text-[10px] text-white tabular-nums">{formatDuration(l.endSeconds - l.startSeconds)}</span>
                {l.done && (
                  <span className="absolute inset-0 grid place-items-center bg-black/35">
                    <Check aria-hidden="true" className="size-5 text-white" strokeWidth={3} />
                    <span className="sr-only">Done</span>
                  </span>
                )}
              </span>
              <span className={cn("line-clamp-2 min-w-0 flex-1 pt-0.5 text-[0.82rem] leading-snug", isCurrent && "font-medium", l.skipped && !isCurrent && "text-ink-soft line-through")}>{l.title}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
