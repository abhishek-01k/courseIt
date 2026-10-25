import { Check, Eye, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { lessonPath } from "@/lib/paths";
import { cn, formatDuration } from "@/lib/utils";
import type { CoursePlan } from "../queries";

type Lesson = CoursePlan["lessons"][number];

// Lessons grouped into the learner's days. Every planned lesson opens right away (the video is ready);
// notes and quiz fill in as each is written.
export default function LessonList({ slug, plan, building }: { slug: string; plan: CoursePlan; building: boolean }) {
  const days = Map.groupBy(plan.lessons, (l) => l.day);

  return (
    <div className="flex flex-col gap-6">
      {[...days].map(([day, list]) => {
        const seconds = list.reduce((t, l) => t + l.endSeconds - l.startSeconds, 0);
        const isToday = day === plan.today;
        const allDone = list.every((l) => l.done);
        return (
          <section key={day} aria-labelledby={`day-${day}`} className="flex flex-col gap-2.5">
            <h3 id={`day-${day}`} className="flex items-center gap-2.5 font-display text-[1.2rem]">
              Day {day}
              <span className="font-mono text-label tracking-[0.07em] text-ink-soft tabular-nums">{formatDuration(seconds)}</span>
              {isToday && <span className="rounded-full bg-moss px-2.5 py-1 text-[0.75rem] font-medium text-on-moss">Today</span>}
              {allDone && (
                <>
                  <Check aria-hidden="true" className="size-4 text-ok-fg" />
                  <span className="sr-only">Day done</span>
                </>
              )}
            </h3>
            <ol className="flex flex-col gap-2.5">
              {list.map((lesson) => (
                <li key={lesson.id}>
                  <LessonRow slug={slug} lesson={lesson} building={building} />
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function LessonRow({ slug, lesson, building }: { slug: string; lesson: Lesson; building: boolean }) {
  return (
    <Link
      href={lessonPath(slug, lesson.position)}
      className={cn(
        "flex items-center gap-4 rounded-card bg-surface p-4 shadow-[0_0_0_1px_var(--line)] transition-shadow hover:shadow-[0_20px_40px_-24px_rgba(22,49,92,0.4),0_0_0_1px_var(--line)] sm:p-5",
        lesson.done && "opacity-80",
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
        {lesson.watched ? (
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
