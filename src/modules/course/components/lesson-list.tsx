"use client";

import { Check, Eye, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { lessonPath } from "@/lib/paths";
import { cn, formatDuration } from "@/lib/utils";
import type { CoursePlan } from "../queries";

type Lesson = CoursePlan["lessons"][number];

// Lessons split into the learner's days: Day tabs on top (today's opens first), that day's lessons below.
// Every planned lesson opens right away (the video is ready); notes and quiz fill in as each is written.
export default function LessonList({ slug, plan, building }: { slug: string; plan: CoursePlan; building: boolean }) {
  const days = [...Map.groupBy(plan.lessons, (l) => l.day)];
  const [day, setDay] = useState(days.some(([d]) => d === plan.today) ? plan.today : (days[0]?.[0] ?? 1));
  const list = days.find(([d]) => d === day)?.[1] ?? [];
  const seconds = list.reduce((t, l) => t + l.endSeconds - l.startSeconds, 0);

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Days" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {days.map(([d, l]) => {
          const selected = d === day;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="day-panel"
              onClick={() => setDay(d)}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[0.9rem] font-medium whitespace-nowrap transition-colors",
                selected ? "bg-moss text-on-moss" : "bg-surface text-ink-soft shadow-[inset_0_0_0_1px_var(--line)] hover:text-ink",
              )}
            >
              {l.every((x) => x.done || x.skipped) && <Check aria-hidden="true" className="size-4" />}
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

      <section id="day-panel" role="tabpanel" aria-labelledby={`day-${day}`} className="flex flex-col gap-2.5">
        <h3 id={`day-${day}`} className="flex items-center gap-2.5 font-display text-[1.2rem]">
          Day {day}
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft tabular-nums">
            {list.length} {list.length === 1 ? "lesson" : "lessons"} · {formatDuration(seconds)}
          </span>
          {day === plan.today && <span className="rounded-full bg-moss px-2.5 py-1 text-[0.75rem] font-medium text-on-moss">Today</span>}
        </h3>
        <ol className="flex flex-col gap-2.5">
          {list.map((lesson) => (
            <li key={lesson.id}>
              <LessonRow slug={slug} lesson={lesson} building={building} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function LessonRow({ slug, lesson, building }: { slug: string; lesson: Lesson; building: boolean }) {
  return (
    <Link
      href={lessonPath(slug, lesson.position)}
      className={cn(
        "flex items-center gap-4 rounded-card bg-surface p-4 shadow-[0_0_0_1px_var(--line)] transition-shadow hover:shadow-[0_20px_40px_-24px_rgba(22,49,92,0.4),0_0_0_1px_var(--line)] sm:p-5",
        (lesson.done || lesson.skipped) && "opacity-70",
      )}
    >
      {lesson.done ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-moss text-on-moss">
          <Check aria-hidden="true" className="size-5" />
          <span className="sr-only">Lesson {lesson.position + 1}, done</span>
        </span>
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime-soft font-display text-[1.05rem] text-pill-ink tabular-nums">
          {lesson.position + 1}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{lesson.title}</span>
        <span className="line-clamp-1 text-[0.88rem] text-ink-soft">{lesson.summary}</span>
      </span>
      <span className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <span className="font-mono text-label text-ink-soft tabular-nums">{formatDuration(lesson.endSeconds - lesson.startSeconds)}</span>
        {lesson.skipped && !lesson.done ? (
          <span className="text-[0.8rem] text-ink-soft">Skipped · you know this</span>
        ) : lesson.watched ? (
          <span className="inline-flex items-center gap-1 text-[0.8rem] text-ok-fg">
            <Eye aria-hidden="true" className="size-3.5" /> Watched{lesson.quizDone && " · quiz done"}
          </span>
        ) : lesson.ready ? (
          <span className="inline-flex items-center gap-1 text-[0.8rem] text-ok-fg">
            <Check aria-hidden="true" className="size-3.5" /> Notes and quiz
          </span>
        ) : building ? (
          <span className="inline-flex items-center gap-1 text-[0.8rem] text-ink-soft">
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" /> Writing quiz…
          </span>
        ) : (
          <span className="text-[0.8rem] text-warn-fg">Video only · retry above</span>
        )}
      </span>
      <Play aria-hidden="true" className="size-4 shrink-0 text-moss" />
    </Link>
  );
}
