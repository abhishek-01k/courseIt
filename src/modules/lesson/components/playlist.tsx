"use client";

import { Check, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import { cn, formatDuration } from "@/lib/utils";
import { coursePath, lessonPath } from "@/lib/paths";
import type { CoursePlan } from "@/modules/course/queries";

// Every lesson in the course, grouped by the learner's days; scrolls to the one playing.
export default function Playlist({ slug, courseTitle, plan, currentId }: { slug: string; courseTitle: string; plan: CoursePlan; currentId: string }) {
  const box = useRef<HTMLDivElement>(null);
  const items = plan.lessons;
  const current = items.find((l) => l.id === currentId);

  useEffect(() => {
    const el = box.current;
    const row = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && row) el.scrollTop = row.offsetTop - el.offsetTop - 48;
  }, [currentId]);

  return (
    <section aria-label="Course lessons" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]">
      <header className="shrink-0 border-b px-4 py-3">
        <Link href={coursePath(slug)} className="line-clamp-1 font-display text-[1.1rem] hover:underline">
          {courseTitle}
        </Link>
        <p className="text-[0.82rem] text-ink-soft tabular-nums">
          Day {current?.day} of {plan.dayCount} · Lesson {(current?.position ?? 0) + 1} of {items.length} · {items.filter((l) => l.done).length} done
        </p>
      </header>
      <div ref={box} className="relative max-h-[420px] min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 pb-1.5 lg:max-h-none">
        {items.map((l, i) => {
          const isCurrent = l.id === currentId;
          return (
            <Fragment key={l.id}>
              {(i === 0 || items[i - 1].day !== l.day) && (
                <p className="sticky top-0 z-10 -mx-1.5 bg-surface px-4 pt-2.5 pb-1.5 text-[0.75rem] font-medium text-ink-soft">
                  Day {l.day}
                  {l.day === plan.today && " · Today"}
                </p>
              )}
              <Link
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
                <span className={cn("line-clamp-2 min-w-0 flex-1 pt-0.5 text-[0.82rem] leading-snug", isCurrent && "font-medium")}>{l.title}</span>
              </Link>
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
