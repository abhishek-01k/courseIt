import { Flame, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { coursePath, lessonPath } from "@/lib/paths";
import { formatDuration } from "@/lib/utils";
import { getContinue, getStreak } from "../queries";

export default async function ContinueLearning() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const [resume, streak] = await Promise.all([getContinue(userId), getStreak(userId)]);
  if (!resume) return null;

  const { course, next, total, finished, dayCount } = resume;
  const pct = total ? Math.round((finished / total) * 100) : 0;

  return (
    <section aria-label="Continue learning" className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:flex-row sm:items-center sm:p-6">
        {course.thumbnail && <Image src={course.thumbnail} alt="" width={176} height={99} className="aspect-video w-full rounded-2xl object-cover sm:w-44" />}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">
            {next ? "Continue where you left off" : "Course finished"} · {course.channel}
          </span>
          <h2 className="truncate text-[1.4rem] leading-tight">{course.title}</h2>
          {next ? (
            <p className="text-[0.92rem] text-ink-soft">
              Day {next.day} of {dayCount} · Lesson {next.position + 1}: {next.title} · {formatDuration(next.endSeconds - next.startSeconds)}
            </p>
          ) : (
            <p className="text-[0.92rem] text-ink-soft">Every lesson done. Pick your next course below.</p>
          )}
          <div className="mt-1 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-lime-soft" role="progressbar" aria-label="Course progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-moss" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[0.85rem] text-ink-soft tabular-nums">
              {finished}/{total}
            </span>
          </div>
        </div>
        <Link href={next ? lessonPath(course.slug, next.position) : coursePath(course.slug)} className={buttonVariants({ size: "lg" })}>
          <Play aria-hidden="true" />
          {next ? "Continue" : "Open course"}
        </Link>
      </div>

      <div className="ticket flex flex-col justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-mono text-label tracking-[0.07em] text-[#2e3524] uppercase">
          <Flame aria-hidden="true" className="size-4" /> Streak
        </div>
        <div className="mt-6 font-display text-stat leading-none tabular-nums">
          {streak} {streak === 1 ? "day" : "days"}
        </div>
      </div>
    </section>
  );
}
