import { Flame, Play } from "lucide-react";
import Thumbnail from "@/components/thumbnail";
import Link from "next/link";
import Landscape from "@/components/landscape";
import StatusBadge from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { coursePath, lessonPath } from "@/lib/paths";
import { formatDuration } from "@/lib/utils";
import type {
  getContinue,
  getGreeting,
  getMyCourses,
  getWeekStats,
} from "../queries";
import CourseUrlForm from "./course-url-form";

type Props = {
  firstName: string | null;
  greeting: Awaited<ReturnType<typeof getGreeting>>;
  resume: NonNullable<Awaited<ReturnType<typeof getContinue>>>;
  stats: Awaited<ReturnType<typeof getWeekStats>>;
  myCourses: Awaited<ReturnType<typeof getMyCourses>>;
};

// A returning learner's Today (storyboard frame 8): pick up where you stopped, this week at a glance,
// start something new, and every course you're taking with its day.
export default function ReturningToday({
  firstName,
  greeting,
  resume,
  stats,
  myCourses,
}: Props) {
  const { course, next } = resume;
  const plan = myCourses.find((c) => c.course.id === course.id)?.plan;
  const leftToday =
    plan && next
      ? plan.lessons.filter((l) => l.day === next.day && !l.done && !l.skipped)
          .length
      : 0;

  const tickets = [
    {
      label: "Streak",
      value: `${stats.streak} ${stats.streak === 1 ? "day" : "days"}`,
      note: `Today counts. Come back tomorrow for ${stats.streak + 1}.`,
      icon: true,
    },
    { label: "Lessons this week", value: String(stats.lessons) },
    {
      label: "Quiz score",
      value: stats.quizScore === null ? "–" : `${stats.quizScore}%`,
    },
    {
      label: "Watched this week",
      value: stats.watchedSeconds ? formatDuration(stats.watchedSeconds) : "0m",
    },
  ];

  return (
    <>
      <section
        aria-label="Welcome"
        className="relative min-h-[300px] overflow-hidden rounded-panel shadow-blue"
      >
        <Landscape scene="sunrise" className="dark:hidden" />
        <Landscape scene="night" className="hidden dark:block" />
        <div className="glass relative m-4 flex max-w-[600px] flex-col gap-3 rounded-[24px] px-6 py-6 sm:m-6 sm:px-7">
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">
            {greeting.date}
          </span>
          <h1 className="text-[clamp(1.8rem,3.4vw,2.3rem)] leading-[1.08]">
            {greeting.hello}
            {firstName ? `, ${firstName}` : ""}.{" "}
            <em className="italic text-moss">
              {next
                ? `${leftToday} ${leftToday === 1 ? "lesson" : "lessons"} left in Day ${next.day}.`
                : "Course finished!"}
            </em>
          </h1>
          <p className="line-clamp-1 text-[0.92rem] text-ink-soft">
            {course.title}
            {next &&
              ` · Lesson ${next.position + 1}: ${next.title} · ${formatDuration(next.endSeconds - next.startSeconds)}`}
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {next ? (
              <Link
                href={lessonPath(course.slug, next.position)}
                className={buttonVariants({ size: "lg" })}
              >
                <Play aria-hidden="true" />
                Continue lesson {next.position + 1}
              </Link>
            ) : null}
            <Link
              href={coursePath(course.slug)}
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "bg-glass",
              })}
            >
              See the plan
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-label="This week"
        className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5"
      >
        {tickets.map((t) => (
          <div key={t.label} className="ticket px-6 py-5">
            <div className="flex items-center gap-2 font-mono text-label tracking-[0.07em] text-[#2e3524] uppercase">
              {t.icon && <Flame aria-hidden="true" className="size-4" />}
              {t.label}
            </div>
            <div className="mt-7 font-display text-stat leading-none tabular-nums">
              {t.value}
            </div>
            {t.note && (
              <p className="mt-1.5 text-[0.82rem] text-[#2e3524]">{t.note}</p>
            )}
          </div>
        ))}
      </section>

      <section
        aria-labelledby="next-title"
        className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:p-6"
      >
        <h2 id="next-title" className="text-h3 font-medium">
          What do you want to learn next?
        </h2>
        <CourseUrlForm />
      </section>

      <section aria-labelledby="mine-title" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="mine-title" className="text-[1.9rem] leading-[1.1]">
            My <em className="italic text-moss">courses.</em>
          </h2>
          <Link
            href="/courses"
            className="text-[0.92rem] font-medium text-moss underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-[18px]">
          {myCourses.map(({ course: c, plan: p }) => {
            const done = p.lessons.filter((l) => l.done).length;
            const total = p.lessons.length;
            const nextUp = p.lessons.find((l) => !l.done && !l.skipped);
            const pct = total ? Math.round((done / total) * 100) : 0;
            const finished = total > 0 && done === total;
            return (
              <li key={c.id} className="flex">
                <Link
                  href={
                    nextUp
                      ? lessonPath(c.slug, nextUp.position)
                      : coursePath(c.slug)
                  }
                  className="flex w-full flex-col rounded-card bg-surface p-2.5 shadow-[0_0_0_1px_var(--line)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_30px_60px_-30px_rgba(22,49,92,0.45),0_0_0_1px_var(--line)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-lime-soft">
                    <Thumbnail src={c.thumbnail} fill sizes="(min-width: 768px) 360px, 100vw" className="object-cover" />
                    <StatusBadge
                      tone={
                        finished ? "ok" : c.status === "ready" ? "warn" : "idle"
                      }
                      className="absolute top-3 left-3"
                    >
                      {finished
                        ? "Completed"
                        : c.status === "ready"
                          ? "In progress"
                          : "Building"}
                    </StatusBadge>
                  </div>
                  <div className="flex flex-col gap-2 px-3 pt-4 pb-3 flex-1 justify-between">
                    <div className="flex flex-col gap-2">
                      <h3 className="line-clamp-2 text-h3 font-medium">
                        {c.title}
                      </h3>
                      <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase tabular-nums">
                        {done} of {total} lessons · {p.minutesPerDay} min a day
                      </span>
                    </div>
                    <div>
                      <div className="mt-1.5 flex justify-between gap-3 text-[0.88rem] text-ink-soft">
                        <span className="line-clamp-1">
                          {nextUp
                            ? `Next: ${nextUp.title}`
                            : finished
                              ? "All lessons done"
                              : "Lessons on the way"}
                        </span>
                        <span className="tabular-nums">{pct}%</span>
                      </div>
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-lime-soft"
                        role="progressbar"
                        aria-label={`${c.title} progress`}
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full bg-moss"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
