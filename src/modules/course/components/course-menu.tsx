"use client";

import { Check, Loader2, Map as MapIcon, MoreVertical, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { addCourseToStageAction } from "@/modules/roadmap/actions";
import type { RoadmapChoice } from "@/modules/roadmap/queries";
import { enrollAction } from "../actions";

const item = "min-h-11 gap-3 rounded-xl px-3 text-[0.95rem] text-ink focus:bg-lime-soft focus:text-pill-ink";

// Storyboard 10b: ⋮ on a course page. Enroll (only if you aren't) and Add to a roadmap (a dialog of yours).
export default function CourseMenu({ courseId, courseTitle, enrolled, roadmaps }: { courseId: string; courseTitle: string; enrolled: boolean; roadmaps: RoadmapChoice[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [enrolling, startEnroll] = useTransition();
  const [justEnrolled, setJustEnrolled] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Course options"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line)] transition-colors outline-none hover:bg-lime-soft/60 focus-visible:ring-2 focus-visible:ring-dusk data-popup-open:bg-lime-soft/60"
        >
          {enrolling ? <Loader2 aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" /> : <MoreVertical aria-hidden="true" className="size-5" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-[260px] rounded-[18px] bg-surface p-1.5 shadow-[0_0_0_1px_var(--line),0_24px_48px_-20px_rgba(22,49,92,0.4)] ring-0">
          {!enrolled && (
            <DropdownMenuItem
              className={item}
              onClick={() =>
                startEnroll(async () => {
                  await enrollAction(courseId);
                  setJustEnrolled(true);
                })
              }
            >
              <Plus className="size-[18px]" />
              Enroll in this course
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className={item} onClick={() => dialog.current?.showModal()}>
            <MapIcon className="size-[18px]" />
            Add to a roadmap…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {justEnrolled && enrolled && (
        <p role="status" className="sr-only">
          Enrolled. It’s in My courses and on Today.
        </p>
      )}

      <dialog
        ref={dialog}
        aria-labelledby="add-roadmap-title"
        className="m-auto w-[min(520px,calc(100%-32px))] rounded-card bg-surface p-0 text-ink shadow-[0_0_0_1px_var(--line),0_40px_80px_-30px_rgba(22,49,92,0.5)] backdrop:bg-[#0f1611]/40"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close(); // click on the backdrop
        }}
      >
        <div className="flex flex-col gap-4 p-[22px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="add-roadmap-title" className="text-h3 font-medium">
                Add to a roadmap
              </h2>
              <p className="mt-1 text-[0.9rem] text-ink-soft">
                <span className="line-clamp-1">{courseTitle}</span>
                Pick a roadmap and the stage it belongs in.
              </p>
            </div>
            <Button type="button" variant="outline" size="icon" className="size-11 shrink-0 rounded-full" aria-label="Close" onClick={() => dialog.current?.close()}>
              <X aria-hidden="true" className="size-[18px]" />
            </Button>
          </div>

          {roadmaps.length ? (
            <ul className="flex max-h-[50dvh] flex-col gap-2.5 overflow-y-auto overscroll-contain">
              {roadmaps.map((r) => (
                <RoadmapRow key={r.id} roadmap={r} courseId={courseId} />
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl bg-paper px-4 py-5 text-[0.92rem] text-ink-soft shadow-[inset_0_0_0_1px_var(--line)]">
              You have no roadmaps yet. A roadmap is your own set of courses from different creators, in stages.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t pt-3.5">
            <Link href="/roadmaps" className="inline-flex min-h-11 items-center gap-1.5 text-[0.92rem] font-medium text-moss underline-offset-4 hover:underline">
              <Plus aria-hidden="true" className="size-4" />
              New roadmap
            </Link>
            <Button type="button" size="lg" variant="outline" onClick={() => dialog.current?.close()}>
              Done
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}

function RoadmapRow({ roadmap: r, courseId }: { roadmap: RoadmapChoice; courseId: string }) {
  const [stageId, setStageId] = useState(r.stages.at(-1)?.id ?? "");
  const [pending, start] = useTransition();
  const selectId = `stage-${r.id}`;
  return (
    <li className="flex flex-wrap items-center gap-2.5 rounded-2xl bg-paper px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--line)]">
      <span className="min-w-0 flex-[1_1_180px]">
        <span className="block font-medium">{r.title}</span>
        <span className="block text-[0.85rem] text-ink-soft tabular-nums">
          {r.stages.length} {r.stages.length === 1 ? "stage" : "stages"} · {r.courseCount} {r.courseCount === 1 ? "course" : "courses"}
        </span>
      </span>
      {r.inStage ? (
        <span className="inline-flex items-center gap-1.5 text-[0.88rem] font-medium text-ok-fg">
          <Check aria-hidden="true" className="size-4" />
          In {r.inStage}
        </span>
      ) : r.stages.length ? (
        <>
          <label htmlFor={selectId} className="sr-only">
            Stage in {r.title}
          </label>
          <select
            id={selectId}
            value={stageId}
            onChange={(e) => setStageId(e.target.value)}
            className="min-h-10 max-w-[180px] rounded-xl bg-surface px-2.5 text-[0.88rem] text-ink shadow-[inset_0_0_0_1px_var(--line)] outline-none focus-visible:ring-2 focus-visible:ring-dusk"
          >
            {r.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Button type="button" className="h-10 px-4" disabled={pending || !stageId} onClick={() => start(() => addCourseToStageAction(stageId, courseId))}>
            {pending && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
            Add
          </Button>
        </>
      ) : (
        <span className="text-[0.85rem] text-ink-soft">Add a stage first</span>
      )}
    </li>
  );
}
