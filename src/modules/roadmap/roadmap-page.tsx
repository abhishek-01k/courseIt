import { eq } from "drizzle-orm";
import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import StatusBadge from "@/components/status-badge";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { coursePath } from "@/lib/paths";
import { cn, formatDuration } from "@/lib/utils";
import OwnerBar from "./components/owner-bar";
import { AddCourseForm, AddStageForm, RemoveCourseButton, StageControls } from "./components/stage-forms";
import { getRoadmap, type RoadmapView } from "./queries";

type Stage = RoadmapView["stages"][number];
type State = "done" | "now" | "next" | "empty";

const LOOK = {
  done: { tone: "ok", label: "Done" },
  now: { tone: "warn", label: "In progress" },
  next: { tone: "idle", label: "Up next" },
  empty: { tone: "idle", label: "No courses yet" },
} as const;

const finished = (s: Stage) => s.courses.length > 0 && s.courses.every((c) => c.lessons > 0 && c.pct === 100);

// Storyboard frame 10: a roadmap's stages and courses, your progress, and (for its owner) editing.
export default async function RoadmapPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, session] = await Promise.all([params, auth()]);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [roadmap, [me]] = await Promise.all([getRoadmap(slug, userId), db.select({ minutesPerDay: users.minutesPerDay }).from(users).where(eq(users.id, userId))]);
  if (!roadmap) notFound();

  const firstOpen = roadmap.stages.findIndex((s) => !finished(s));
  const states: State[] = roadmap.stages.map((s, i) => (!s.courses.length ? "empty" : finished(s) ? "done" : i === firstOpen ? "now" : "next"));
  const nextCourse = roadmap.stages.flatMap((s) => s.courses).find((c) => !(c.lessons > 0 && c.pct === 100));
  const stageNow = firstOpen === -1 ? roadmap.stages.length : firstOpen + 1;

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pt-8 pb-20 sm:px-6">
      <Link href={roadmap.isOwner ? "/roadmaps" : "/community?tab=roadmaps"} className="inline-flex items-center gap-2 self-start text-[0.9rem] text-ink-soft hover:text-ink">
        <ArrowLeft aria-hidden="true" className="size-4" />
        {roadmap.isOwner ? "All roadmaps" : "Community roadmaps"}
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col items-start gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">{roadmap.isOwner ? "Roadmap · by you" : `Roadmap · by ${roadmap.author ?? "a learner"}`}</span>
            {roadmap.isOwner && <StatusBadge tone={roadmap.published ? "ok" : "idle"}>{roadmap.published ? "Public · in Community" : "Private"}</StatusBadge>}
          </div>
          <h1 className="text-[clamp(2.1rem,4vw,2.8rem)] leading-[1.06]">
            <em className="italic text-moss">{roadmap.title}</em>
          </h1>
          {roadmap.description && <p className="max-w-[560px] text-ink-soft">{roadmap.description}</p>}
        </div>
        {roadmap.isOwner && <OwnerBar id={roadmap.id} title={roadmap.title} description={roadmap.description} published={roadmap.published} />}
      </header>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-label="Stages" className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          {roadmap.stages.map((stage, i) => {
            const state = states[i];
            return (
              <article
                key={stage.id}
                className={cn("flex flex-col gap-3.5 rounded-card bg-surface px-[22px] py-5", state === "now" ? "shadow-[0_0_0_2px_var(--moss)]" : "shadow-[0_0_0_1px_var(--line)]")}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full font-display text-[1.1rem] tabular-nums",
                      state === "done" ? "bg-ok-bg text-ok-fg" : state === "now" ? "bg-moss text-on-moss" : "bg-idle-bg text-idle-fg",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-[1_1_200px]">
                    <h2 className="text-h3 font-medium">{stage.name}</h2>
                    <span className="text-[0.85rem] text-ink-soft tabular-nums">
                      {stage.courses.length} {stage.courses.length === 1 ? "course" : "courses"}
                      {state === "done" ? " · finished" : state === "now" ? " · you are here" : ""}
                    </span>
                  </div>
                  <StatusBadge tone={LOOK[state].tone}>{LOOK[state].label}</StatusBadge>
                  {roadmap.isOwner && <StageControls stageId={stage.id} name={stage.name} />}
                </div>

                {stage.courses.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {stage.courses.map((c) => (
                      <li key={c.id} className="flex items-center gap-1 rounded-[14px] bg-paper pr-1">
                        <Link href={coursePath(c.slug)} className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] p-2 hover:bg-lime-soft/40">
                          <span className="relative aspect-[16/10] w-16 shrink-0 overflow-hidden rounded-[10px] bg-lime-soft">
                            {c.thumbnail && <Image src={c.thumbnail} alt="" fill sizes="64px" className="object-cover" />}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium">{c.title}</span>
                            <span className="text-[0.82rem] text-ink-soft tabular-nums">
                              {c.channel} · {formatDuration(c.durationSeconds)}
                            </span>
                          </span>
                          {c.status === "ready" || c.lessons > 0 ? (
                            <span className={cn("font-mono text-label tabular-nums", c.pct === 100 ? "text-ok-fg" : "text-ink-soft")}>{c.pct}%</span>
                          ) : c.status === "failed" ? (
                            <span className="text-[0.8rem] text-warn-fg">Build failed</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[0.8rem] text-ink-soft">
                              <Loader2 aria-hidden="true" className="size-3.5 animate-spin motion-reduce:animate-none" />
                              Building
                            </span>
                          )}
                        </Link>
                        {roadmap.isOwner && <RemoveCourseButton roadmapId={roadmap.id} courseId={c.id} title={c.title} />}
                      </li>
                    ))}
                  </ul>
                )}

                {roadmap.isOwner && <AddCourseForm stageId={stage.id} stageName={stage.name} />}
              </article>
            );
          })}
          {roadmap.isOwner && <AddStageForm roadmapId={roadmap.id} next={roadmap.stages.length + 1} />}
          {!roadmap.stages.length && !roadmap.isOwner && <p className="text-ink-soft">This roadmap has no stages yet.</p>}
        </section>

        <aside className="flex min-w-0 flex-[1_1_290px] flex-col gap-3.5">
          <div className="ticket px-[22px] pt-5 pb-[22px]">
            <div className="font-mono text-label tracking-[0.07em] text-[#2e3524] uppercase">Roadmap progress</div>
            <div className="mt-8 font-display text-stat leading-none tabular-nums">{roadmap.pct}%</div>
            <div className="mt-1.5 text-[0.85rem] text-[#2e3524] tabular-nums">
              {roadmap.coursesDone} of {roadmap.courseCount} courses{roadmap.stages.length ? ` · stage ${Math.min(stageNow, roadmap.stages.length)} of ${roadmap.stages.length}` : ""}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-card bg-surface p-[22px] shadow-[0_0_0_1px_var(--line)]">
            <h2 className="text-h3 font-medium">Keep going</h2>
            <p className="text-[0.92rem] text-ink-soft">Each course keeps its own day-by-day plan, packed from your daily time.</p>
            <p className="text-[0.92rem] tabular-nums">
              <span className="font-medium">{me?.minutesPerDay ?? 90} min a day</span> ·{" "}
              <Link href="/settings" className="font-medium text-moss underline-offset-4 hover:underline">
                Change in Settings
              </Link>
            </p>
            {nextCourse ? (
              <Link
                href={coursePath(nextCourse.slug)}
                className="flex min-h-12 flex-col justify-center rounded-[22px] bg-moss px-5 py-2.5 text-on-moss transition-colors hover:bg-moss-dark focus-visible:ring-2 focus-visible:ring-dusk focus-visible:outline-none"
              >
                <span className="text-[0.78rem] opacity-80">Continue</span>
                <span className="line-clamp-2 text-[0.92rem] font-medium">{nextCourse.title}</span>
              </Link>
            ) : (
              <p className="text-[0.92rem] text-ink-soft">{roadmap.courseCount ? "Every course here is done. Nice work." : "Add a course to a stage to begin."}</p>
            )}
          </div>

          {roadmap.creators.length > 0 && (
            <div className="flex flex-col gap-2.5 rounded-card bg-surface p-[22px] shadow-[0_0_0_1px_var(--line)]">
              <h2 className="text-h3 font-medium">Creators in this roadmap</h2>
              <p className="text-[0.9rem] text-ink-soft">{roadmap.creators.join(", ")}</p>
              <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Every course links to the original video</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
