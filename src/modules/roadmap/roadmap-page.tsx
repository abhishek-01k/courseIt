import { eq } from "drizzle-orm";
import { ArrowLeft, Loader2, LogIn } from "lucide-react";
import Thumbnail from "@/components/thumbnail";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShareButton from "@/components/share-button";
import StatusBadge from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { coursePath, loginPath, roadmapPath } from "@/lib/paths";
import { cn, formatDuration, initials } from "@/lib/utils";
import EnrollButton from "./components/enroll-button";
import OwnerBar from "./components/owner-bar";
import {
  AddCourseForm,
  AddStageForm,
  RemoveCourseButton,
  StageControls,
  StageMove,
} from "./components/stage-forms";
import { getRoadmap, type RoadmapView } from "./queries";

type Stage = RoadmapView["stages"][number];
type State = "done" | "now" | "next" | "empty";

const LOOK = {
  done: { tone: "ok", label: "Done" },
  now: { tone: "warn", label: "In progress" },
  next: { tone: "idle", label: "Up next" },
  empty: { tone: "idle", label: "No courses yet" },
} as const;

const finished = (s: Stage) =>
  s.courses.length > 0 &&
  s.courses.every((c) => c.lessons > 0 && c.pct === 100);

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, session] = await Promise.all([params, auth()]);
  const userId = session?.user?.id ?? null;

  const [roadmap, [me]] = await Promise.all([
    getRoadmap(slug, userId),
    userId
      ? db
          .select({ minutesPerDay: users.minutesPerDay })
          .from(users)
          .where(eq(users.id, userId))
      : [undefined],
  ]);
  if (!roadmap) notFound();
  const studying = roadmap.isOwner || roadmap.isEnrolled; // has their own progress on it

  const firstOpen = roadmap.stages.findIndex((s) => !finished(s));
  // Progress badges only make sense for someone studying it; visitors see the stages plainly.
  const states: State[] = roadmap.stages.map((s, i) =>
    !s.courses.length
      ? "empty"
      : !studying
        ? "next"
        : finished(s)
          ? "done"
          : i === firstOpen
            ? "now"
            : "next",
  );
  const nextCourse = roadmap.stages
    .flatMap((s) => s.courses)
    .find((c) => !(c.lessons > 0 && c.pct === 100));
  const stageNow = firstOpen === -1 ? roadmap.stages.length : firstOpen + 1;

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pt-8 pb-20 sm:px-6">
      {userId && (
        <Link
          href={studying ? "/roadmaps" : "/community?tab=roadmaps"}
          className="inline-flex items-center gap-2 self-start text-[0.9rem] text-ink-soft hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {studying ? "All roadmaps" : "Community roadmaps"}
        </Link>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col items-start gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">
              {roadmap.isOwner
                ? "Roadmap · by you"
                : `Roadmap · by ${roadmap.author ?? "a learner"}`}
            </span>
            {roadmap.isOwner && (
              <StatusBadge tone={roadmap.published ? "ok" : "idle"}>
                {roadmap.published ? "In Community" : "Private"}
              </StatusBadge>
            )}
          </div>
          <h1 className="text-[clamp(2.1rem,4vw,2.8rem)] leading-[1.06]">
            <em className="italic text-moss">{roadmap.title}</em>
          </h1>
          {roadmap.description && (
            <p className="max-w-[560px] text-ink-soft">{roadmap.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Private roadmaps are shared by link: whoever opens it can enroll. */}
          <ShareButton path={roadmapPath(roadmap.slug)} title={roadmap.title} />
          {roadmap.isOwner ? (
            <OwnerBar
              id={roadmap.id}
              title={roadmap.title}
              description={roadmap.description}
              published={roadmap.published}
              admin={isAdmin(session?.user?.email)}
            />
          ) : userId ? (
            <EnrollButton
              roadmapId={roadmap.id}
              enrolled={roadmap.isEnrolled}
            />
          ) : (
            <Link
              href={loginPath(roadmapPath(roadmap.slug))}
              className={buttonVariants({ size: "lg" })}
            >
              <LogIn aria-hidden="true" />
              Sign in to enroll
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-6">
        <section
          aria-label="Stages"
          className="flex min-w-0 flex-[999_1_560px] flex-col gap-4"
        >
          {roadmap.stages.map((stage, i) => {
            const state = states[i];
            return (
              <div key={stage.id} className="flex items-start gap-2">
              {/* Reorder handles sit beside the stage, not inside it. */}
              {roadmap.isOwner && roadmap.stages.length > 1 && (
                <StageMove stageId={stage.id} name={stage.name} first={i === 0} last={i === roadmap.stages.length - 1} />
              )}
              <article
                className={cn(
                  "flex min-w-0 flex-1 flex-col gap-3.5 rounded-card bg-surface px-[22px] py-5",
                  state === "now"
                    ? "shadow-[0_0_0_2px_var(--moss)]"
                    : "shadow-[0_0_0_1px_var(--line)]",
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full font-display text-[1.1rem] tabular-nums",
                      state === "done"
                        ? "bg-ok-bg text-ok-fg"
                        : state === "now"
                          ? "bg-moss text-on-moss"
                          : "bg-idle-bg text-idle-fg",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-[1_1_200px]">
                    <h2 className="text-h3 font-medium">{stage.name}</h2>
                    <span className="text-[0.85rem] text-ink-soft tabular-nums">
                      {stage.courses.length}{" "}
                      {stage.courses.length === 1 ? "course" : "courses"}
                      {state === "done"
                        ? " · finished"
                        : state === "now"
                          ? " · you are here"
                          : ""}
                    </span>
                  </div>
                  {(studying || state === "empty") && (
                    <StatusBadge tone={LOOK[state].tone}>
                      {LOOK[state].label}
                    </StatusBadge>
                  )}
                  {roadmap.isOwner && (
                    <StageControls stageId={stage.id} name={stage.name} courseCount={stage.courses.length} />
                  )}
                </div>

                {stage.courses.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {stage.courses.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center gap-1 rounded-[14px] bg-paper pr-1"
                      >
                        <Link
                          href={coursePath(c.slug)}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] p-2 hover:bg-lime-soft/40"
                        >
                          <span className="relative aspect-[16/10] w-16 shrink-0 overflow-hidden rounded-[10px] bg-lime-soft">
                            <Thumbnail src={c.thumbnail} fill sizes="64px" className="object-cover" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium">
                              {c.title}
                            </span>
                            <span className="text-[0.82rem] text-ink-soft tabular-nums">
                              {c.channel} · {formatDuration(c.durationSeconds)}
                            </span>
                          </span>
                          {c.status === "ready" || c.lessons > 0 ? (
                            <span
                              className={cn(
                                "font-mono text-label tabular-nums",
                                c.pct === 100 ? "text-ok-fg" : "text-ink-soft",
                              )}
                            >
                              {c.pct}%
                            </span>
                          ) : c.status === "failed" ? (
                            <span className="text-[0.8rem] text-warn-fg">
                              Build failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[0.8rem] text-ink-soft">
                              <Loader2
                                aria-hidden="true"
                                className="size-3.5 animate-spin motion-reduce:animate-none"
                              />
                              Building
                            </span>
                          )}
                        </Link>
                        {roadmap.isOwner && (
                          <RemoveCourseButton
                            roadmapId={roadmap.id}
                            courseId={c.id}
                            title={c.title}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {roadmap.isOwner && (
                  <AddCourseForm stageId={stage.id} stageName={stage.name} />
                )}
              </article>
              </div>
            );
          })}
          {roadmap.isOwner && (
            <AddStageForm
              roadmapId={roadmap.id}
              next={roadmap.stages.length + 1}
            />
          )}
          {!roadmap.stages.length && !roadmap.isOwner && (
            <p className="text-ink-soft">This roadmap has no stages yet.</p>
          )}
        </section>

        <aside className="flex min-w-0 flex-[1_1_290px] flex-col gap-3.5">
          {studying ? (
            <div className="ticket px-[22px] pt-5 pb-[22px]">
              <div className="font-mono text-label tracking-[0.07em] text-[#2e3524] uppercase">
                Roadmap progress
              </div>
              <div className="mt-8 font-display text-stat leading-none tabular-nums">
                {roadmap.pct}%
              </div>
              <div className="mt-1.5 text-[0.85rem] text-[#2e3524] tabular-nums">
                {roadmap.coursesDone} of {roadmap.courseCount} courses
                {roadmap.stages.length
                  ? ` · stage ${Math.min(stageNow, roadmap.stages.length)} of ${roadmap.stages.length}`
                  : ""}
              </div>
            </div>
          ) : (
            <div className="ticket px-[22px] pt-5 pb-[22px]">
              <div className="font-mono text-label tracking-[0.07em] text-[#2e3524] uppercase">
                In this roadmap
              </div>
              <div className="mt-8 font-display text-stat leading-none tabular-nums">
                {roadmap.courseCount}{" "}
                <span className="text-[1.85rem] text-[#2e3524]">
                  {roadmap.courseCount === 1 ? "course" : "courses"}
                </span>
              </div>
              <div className="mt-1.5 text-[0.85rem] text-[#2e3524] tabular-nums">
                {roadmap.seconds
                  ? ` · ${formatDuration(roadmap.seconds)} of video`
                  : ""}
              </div>
            </div>
          )}

          {(roadmap.published || roadmap.followerCount > 0) && (
            <section
              aria-labelledby="followers-title"
              className="flex flex-col gap-3 rounded-card bg-surface p-[22px] shadow-[0_0_0_1px_var(--line)]"
            >
              <h2
                id="followers-title"
                className="flex items-baseline justify-between gap-3 text-h3 font-medium"
              >
                Learners
                <span className="text-[0.95rem] font-normal text-ink-soft tabular-nums">
                  {roadmap.followerCount.toLocaleString("en")}
                </span>
              </h2>
              {roadmap.followers.length ? (
                <ul className="flex flex-col gap-2">
                  {roadmap.followers.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-2.5 text-[0.92rem]"
                    >
                      <Thumbnail
                        src={f.image}
                        width={28}
                        height={28}
                        referrerPolicy="no-referrer"
                        className="size-7 shrink-0 rounded-full"
                        fallback={
                          <span
                            aria-hidden="true"
                            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lime-soft font-display text-[0.7rem] text-pill-ink"
                          >
                            {initials(f.name)}
                          </span>
                        }
                      />
                      <span className="truncate">{f.name ?? "A learner"}</span>
                    </li>
                  ))}
                  {roadmap.followerCount > roadmap.followers.length && (
                    <li className="text-[0.85rem] text-ink-soft tabular-nums">
                      and{" "}
                      {(
                        roadmap.followerCount - roadmap.followers.length
                      ).toLocaleString("en")}{" "}
                      more
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-[0.92rem] text-ink-soft">
                  {roadmap.isOwner
                    ? "No one yet. Share the link and learners who enroll show up here."
                    : "No one yet. Be the first to enroll."}
                </p>
              )}
            </section>
          )}

          {roadmap.creators.length > 0 && (
            <div className="flex flex-col gap-2.5 rounded-card bg-surface p-[22px] shadow-[0_0_0_1px_var(--line)]">
              <h2 className="text-h3 font-medium">Creators </h2>
              <ul className="flex flex-col gap-1">
                {roadmap.creators.map((creator, id) => (
                  <li key={id} className="text-[0.9rem] text-ink-soft">
                    {creator}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
