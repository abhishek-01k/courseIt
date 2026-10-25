import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import FocusHeader from "@/components/focus-header";
import Pill from "@/components/pill";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { packDays } from "@/lib/pace";
import { coursePath, lessonPath } from "@/lib/paths";
import { formatDuration } from "@/lib/utils";
import { getCourseBySlug, getCoursePlan } from "@/modules/course/queries";
import PlanCompare from "./components/plan-compare";
import SkipSwitch from "./components/skip-switch";
import { getPlacementResult } from "./queries";

export default async function ResultPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, session] = await Promise.all([params, auth()]);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const [plan, result] = await Promise.all([getCoursePlan(userId, course.id), getPlacementResult(userId, course.id)]);
  if (!result) redirect(`/build/${slug}/test`);

  const len = (l: { startSeconds: number; endSeconds: number }) => l.endSeconds - l.startSeconds;
  const known = plan.lessons.filter((l) => l.skipped);
  const learn = plan.lessons.filter((l) => !l.skipped);
  const fullSeconds = plan.lessons.reduce((t, l) => t + len(l), 0);
  const mineSeconds = learn.reduce((t, l) => t + len(l), 0);
  const fullDays = packDays(plan.lessons.map(len), plan.minutesPerDay).at(-1) ?? 0;
  const start = learn.find((l) => !l.done) ?? learn[0];

  const row = (l: (typeof plan.lessons)[number]) => (
    <li key={l.id} className="flex items-center gap-3 border-t py-3">
      <span className={l.skipped ? "min-w-0 flex-1 text-ink-soft line-through" : "min-w-0 flex-1"}>
        <span className="mr-2 font-mono text-label text-ink-soft tabular-nums">{String(l.position + 1).padStart(2, "0")}</span>
        {l.title}
      </span>
      <span className="font-mono text-label text-ink-soft tabular-nums">{formatDuration(len(l))}</span>
      <SkipSwitch courseId={course.id} lessonId={l.id} title={l.title} skipped={l.skipped} />
    </li>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <FocusHeader backHref="/dashboard" backLabel="Back to home">
        <Link href={`/build/${slug}/test`} className="text-[0.9rem] text-ink-soft underline-offset-4 hover:text-ink hover:underline">
          Retake the test
        </Link>
      </FocusHeader>

      <main className="mx-auto flex w-full max-w-[1120px] flex-wrap gap-6 px-4 pt-10 pb-16 sm:px-6">
        <section className="flex min-w-0 flex-[1_1_380px] flex-col gap-4.5">
          <span className="self-start">
            <Pill>Step 2 of 2 · Your placement result</Pill>
          </span>
          <h1 className="text-[clamp(2.1rem,4vw,2.9rem)] leading-[1.05]">
            You already know{" "}
            <em className="italic text-moss">
              {known.length} of {plan.lessons.length} lessons.
            </em>
          </h1>
          <p className="max-w-[460px] text-ink-soft">Nemotron 3 Ultra matched your answers to the lessons they cover. Flip any lesson to watch it anyway.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="ticket px-6 py-5">
              <div className="font-mono text-label tracking-[0.07em] text-[#2e3524] uppercase">Time saved</div>
              <div className="mt-7 font-display text-[2.4rem] leading-none tabular-nums">{formatDuration(fullSeconds - mineSeconds)}</div>
            </div>
            <div className="ticket px-6 py-5">
              <div className="font-mono text-label tracking-[0.07em] text-[#2e3524] uppercase">Score</div>
              <div className="mt-7 font-display text-[2.4rem] leading-none tabular-nums">
                {result.score} / {result.total}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-5 rounded-card bg-surface p-6 shadow-[0_0_0_1px_var(--line)]">
            <PlanCompare
              full={{ time: formatDuration(fullSeconds), days: fullDays, lessons: plan.lessons.length }}
              mine={{ time: formatDuration(mineSeconds), days: plan.dayCount, lessons: learn.length }}
              total={plan.lessons.length}
              minutesPerDay={plan.minutesPerDay}
            />
            <div className="flex flex-wrap gap-2.5">
              {start && (
                <Link href={lessonPath(slug, start.position)} className={buttonVariants({ size: "lg" })}>
                  Start learning
                </Link>
              )}
              <Link href={coursePath(slug)} className={buttonVariants({ variant: "outline", size: "lg" })}>
                See the day plan
              </Link>
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-[1.2_1_460px] flex-col gap-4">
          <div className="rounded-card bg-surface px-5 pt-2 pb-3 shadow-[0_0_0_1px_var(--line)]">
            <h2 className="py-3 text-h3 font-medium">
              You know this <span className="ml-1.5 font-mono text-label tracking-[0.07em] text-ink-soft uppercase">skipped</span>
            </h2>
            {known.length ? <ul>{known.map(row)}</ul> : <p className="border-t py-3 text-[0.92rem] text-ink-soft">Nothing skipped. Every lesson is in your plan.</p>}
          </div>
          <div className="rounded-card bg-surface px-5 pt-2 pb-3 shadow-[0_0_0_1px_var(--line)]">
            <h2 className="py-3 text-h3 font-medium">You&apos;ll learn this</h2>
            <ul>{learn.map(row)}</ul>
          </div>
        </section>
      </main>
    </div>
  );
}
