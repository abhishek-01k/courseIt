import { ArrowLeft, Loader2 } from "lucide-react";
import Thumbnail from "@/components/thumbnail";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import Pill from "@/components/pill";
import StatusBadge from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { coursePath, lessonPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import RefreshWhileBuilding from "@/modules/course/components/refresh-while-building";
import RetryBanner from "@/modules/course/components/retry-banner";
import { getChapterCount, getCourseBySlug, getCoursePlan, getCourseSteps, touchEnrollment } from "@/modules/course/queries";
import { getPlacementResult, getPlacementTest } from "@/modules/placement/queries";

type Step = Awaited<ReturnType<typeof getCourseSteps>>[number];
type Row = { key: string; at: string; text: string; tool: string; status: Step["status"] };

const elapsed = (from: Date, to: Date) => {
  const s = Math.max(0, Math.round((to.getTime() - from.getTime()) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const toolOf = (step: Step) =>
  step.key.startsWith("transcript:")
    ? "Supadata"
    : step.key.startsWith("watch:")
      ? "Gemini"
      : step.key === "plan" || step.key.startsWith("plan:") || step.key === "placement"
        ? (step.detail?.match(/Nemotron [\d.]+ \w+/)?.[0] ?? "Nemotron 3 Ultra")
        : step.key.startsWith("lesson:")
          ? (step.detail?.match(/Nemotron [\d.]+ \w+/)?.[0] ?? "Nemotron 3 Super")
          : "CourseIt";

/**
 * Turns the raw build log into the rows of the onboarding screen: each transcript and the plan on their
 * own row, lesson 1 on its own (it's what the learner waits for), and the other lessons folded into one
 * "Writing lessons 2–N" row so a 30-lesson course doesn't become a 30-row list.
 */
function rows(steps: Step[], lessonCount: number): Row[] {
  if (!steps.length) return [];
  const start = steps[0].startedAt;
  const out: Row[] = [];
  const lessons = steps.filter((s) => s.key.startsWith("lesson:"));
  const plans = steps.filter((s) => s.key.startsWith("plan:")); // a playlist plans each video on its own
  for (const s of steps) {
    if (s.key.startsWith("lesson:") || s.key.startsWith("plan:") || s.key === "finish") continue;
    out.push({ key: s.key, at: elapsed(start, s.startedAt), text: s.label, tool: toolOf(s), status: s.status });
  }
  if (plans.length) {
    const done = plans.filter((s) => s.status === "done").length;
    out.push({
      key: "plans",
      at: elapsed(start, plans[0].startedAt),
      text: `Planning ${plans.length} videos in parallel · ${done} of ${plans.length} done`,
      tool: toolOf(plans[0]),
      status: done === plans.length ? "done" : plans.some((s) => s.status === "running") ? "running" : "failed",
    });
  }
  const [first, ...rest] = lessons;
  if (first) out.push({ key: first.key, at: elapsed(start, first.startedAt), text: first.label, tool: toolOf(first), status: first.status });
  if (rest.length) {
    const done = rest.filter((s) => s.status === "done").length;
    const total = Math.max(rest.length, lessonCount - 1);
    out.push({
      key: "rest",
      at: elapsed(start, rest[0].startedAt),
      text: `Writing lessons 2–${total + 1} in parallel · ${done} of ${total} done`,
      tool: toolOf(rest[0]),
      status: done === total ? "done" : rest.some((s) => s.status === "running") ? "running" : "failed",
    });
  }
  const finish = steps.find((s) => s.key === "finish");
  if (finish) out.push({ key: finish.key, at: elapsed(start, finish.startedAt), text: finish.label, tool: "CourseIt", status: finish.status });
  return out;
}

export default async function OnboardingPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, session] = await Promise.all([params, auth()]);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const [steps, plan, chapters, test, result] = await Promise.all([
    getCourseSteps(course.id),
    getCoursePlan(userId, course.id),
    getChapterCount(course.id),
    getPlacementTest(course.id),
    getPlacementResult(userId, course.id),
  ]);
  after(() => touchEnrollment(userId, course.id));

  console.log("course",course);

  const building = course.status !== "ready" && course.status !== "failed";
  const list = rows(steps, plan.lessons.length);
  const now = steps.find((s) => s.status === "running")?.label ?? (course.status === "ready" ? "Your course is ready" : "Starting…");
  const firstLesson = plan.lessons[0];
  const lessonOneReady = firstLesson?.ready ?? false;
  const placeholders = building ? Math.max(0, 6 - list.length) : 0;

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      {building && <RefreshWhileBuilding />}

      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "lg" })}>
          <ArrowLeft aria-hidden="true" />
          Back to home
        </Link>
        {building && (
          <span className="inline-flex items-center gap-2 text-[0.85rem] text-ink-soft">
            <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            Keeps building if you leave. Find it in My courses.
          </span>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-[1120px] flex-wrap gap-6 px-4 pt-10 pb-16 sm:px-6">
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          <div className="flex flex-wrap items-center gap-5">
            <Thumbnail src={course.thumbnail} width={150} height={84} className="aspect-video w-[150px] rounded-2xl object-cover" />
            <div className="flex min-w-0 flex-[1_1_260px] flex-col items-start gap-2.5">
              <Pill>
                Step 1 of 2 · <span className="max-w-[28ch] truncate">{course.title}</span> · {course.channel}
              </Pill>
              <h1 className="text-[clamp(2rem,4vw,2.5rem)] leading-[1.08]">
                {course.status === "failed" ? "We couldn't finish your " : course.status === "ready" ? "Your " : "Building your "}
                <em className="italic text-moss">course{course.status === "ready" ? " is ready." : "."}</em>
              </h1>
            </div>
          </div>

          <div>
            <div className="flex justify-between gap-3 text-[0.88rem] text-ink-soft" aria-live="polite">
              <span className="truncate">{now}</span>
              <span className="tabular-nums">{course.progress}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-lime-soft" role="progressbar" aria-label="Course build progress" aria-valuenow={course.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-moss transition-[width] duration-500" style={{ width: `${course.progress}%` }} />
            </div>
          </div>

          {course.status === "failed" && <RetryBanner courseId={course.id} message="Something went wrong while building this course. Retry picks up where it stopped." />}

          <ol className="rounded-card bg-surface py-1.5 shadow-[0_0_0_1px_var(--line)]">
            {list.map((r, i) => (
              <li key={r.key} className={cn("flex flex-wrap items-center gap-3.5 px-5 py-3.5", i > 0 && "border-t")}>
                <span className="w-12 font-mono text-label text-ink-soft tabular-nums">{r.at}</span>
                <span className="min-w-0 flex-[1_1_240px]">{r.text}</span>
                <span className="rounded-full bg-lime-soft px-2.5 py-1.5 font-mono text-[0.68rem] tracking-[0.07em] whitespace-nowrap text-pill-ink uppercase">{r.tool}</span>
                <StatusBadge tone={r.status === "done" ? "ok" : r.status === "running" ? "warn" : "err"}>
                  {r.status === "running" && <Loader2 aria-hidden="true" className="-ml-1 size-3 animate-spin motion-reduce:animate-none" />}
                  {r.status === "done" ? "Done" : r.status === "running" ? "Working" : "Retrying"}
                </StatusBadge>
              </li>
            ))}
            {Array.from({ length: placeholders }, (_, i) => (
              <li key={`wait-${i}`} aria-hidden="true" className={cn("flex items-center gap-3.5 px-5 py-4", (list.length > 0 || i > 0) && "border-t")}>
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 flex-1" style={{ maxWidth: `${[70, 55, 64, 48, 60, 42][i % 6]}%` }} />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center gap-3">
            {result ? (
              <Link href={`/build/${slug}/result`} className={buttonVariants({ size: "lg" })}>
                See your placement result
              </Link>
            ) : test.length ? (
              <Link href={`/build/${slug}/test`} className={buttonVariants({ size: "lg" })}>
                Take the 2-minute placement test
              </Link>
            ) : (
              <Button size="lg" disabled>
                {building && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
                {building ? "Writing your placement test…" : "No placement test for this course"}
              </Button>
            )}
            {lessonOneReady && firstLesson ? (
              <Link href={lessonPath(slug, firstLesson.position)} className={buttonVariants({ variant: "outline", size: "lg" })}>
                Start from lesson 1
              </Link>
            ) : (
              <Button size="lg" variant="outline" disabled>
                <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                Lesson 1 is almost ready…
              </Button>
            )}
            {course.status === "ready" && (
              <Link href={coursePath(slug)} className="text-[0.92rem] font-medium text-moss underline-offset-4 hover:underline">
                See the whole plan
              </Link>
            )}
          </div>
        </section>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5">
          <div className="ticket px-6 py-5">
            <div className="font-mono text-label tracking-[0.07em] text-[#2e3524] uppercase">Lessons</div>
            {plan.lessons.length ? (
              <div className="mt-8 font-display text-stat leading-none tabular-nums">{plan.lessons.length}</div>
            ) : (
              <Skeleton className="mt-8 h-11 w-20 bg-[#0f1611]/15" />
            )}
          </div>
          <div className="ticket px-6 py-5">
            <div className="font-mono text-label tracking-[0.07em] text-[#2e3524] uppercase">Creator chapters</div>
            <div className="mt-8 font-display text-stat leading-none tabular-nums">{chapters}</div>
          </div>
          <div className="rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)]">
            <h2 className="text-h3 font-medium">First lessons mapped</h2>
            <ul className="mt-3.5 flex flex-col gap-3 text-[0.92rem]">
              {plan.lessons.length
                ? plan.lessons.slice(0, 4).map((l) => (
                    <li key={l.id} className="flex items-baseline justify-between gap-3">
                      <span className="line-clamp-1">{l.title}</span>
                      <span className="shrink-0 font-mono text-label text-ink-soft tabular-nums">
                        ▶ {Math.floor(l.startSeconds / 60)}:{String(l.startSeconds % 60).padStart(2, "0")}
                      </span>
                    </li>
                  ))
                : Array.from({ length: 4 }, (_, i) => (
                    <li key={i} aria-hidden="true" className="flex items-center justify-between gap-3">
                      <Skeleton className="h-3" style={{ width: `${[70, 55, 64, 42][i]}%` }} />
                      <Skeleton className="h-3 w-14" />
                    </li>
                  ))}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
