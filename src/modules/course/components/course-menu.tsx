"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Check, ChevronDown, Loader2, LogIn, Map as MapIcon, MoreVertical, Plus, Share2, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { sharePage } from "@/components/share-button";
import { act } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { coursePath, loginPath } from "@/lib/paths";
import { addCourseToStageAction } from "@/modules/roadmap/actions";
import type { RoadmapChoice } from "@/modules/roadmap/queries";
import { enrollAction } from "../actions";

const item = "min-h-11 gap-3 rounded-xl px-3 text-[0.95rem] text-ink focus:bg-lime-soft focus:text-pill-ink";
const panel = "rounded-[18px] bg-surface p-1.5 shadow-[0_0_0_1px_var(--line),0_24px_48px_-20px_rgba(22,49,92,0.4)] ring-0";

type Props = { slug: string; courseId: string; courseTitle: string; signedIn: boolean; enrolled: boolean; roadmaps: RoadmapChoice[] };

// Storyboard 10b: ⋮ on a course page. Enroll (if you aren't), Add to a roadmap (a dialog of yours), Share.
// Signed out (a shared link), the first two ask you to sign in and bring you back here.
export default function CourseMenu({ slug, courseId, courseTitle, signedIn, enrolled, roadmaps }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  const [note, setNote] = useState("");
  const here = coursePath(slug);

  const share = async () => {
    if ((await sharePage(here, courseTitle)) === "copied") {
      setNote("Link copied");
      setTimeout(() => setNote(""), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span aria-live="polite" className="text-[0.85rem] text-ink-soft">
        {note}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Course options"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line)] transition-colors outline-none hover:bg-lime-soft/60 focus-visible:ring-2 focus-visible:ring-dusk data-popup-open:bg-lime-soft/60"
        >
          {busy ? <Loader2 aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" /> : <MoreVertical aria-hidden="true" className="size-5" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className={`w-[260px] ${panel}`}>
          {!signedIn ? (
            <DropdownMenuItem render={<Link href={loginPath(here)} />} className={item}>
              <LogIn className="size-[18px]" />
              Sign in to enroll
            </DropdownMenuItem>
          ) : (
            !enrolled && (
              <DropdownMenuItem
                className={item}
                onClick={() =>
                  start(async () => {
                    if ((await act(() => enrollAction(courseId), "Couldn't enroll you in this course.")) === null) return;
                    setNote("Enrolled · it’s in My courses");
                    setTimeout(() => setNote(""), 3000);
                  })
                }
              >
                <Plus className="size-[18px]" />
                Enroll in this course
              </DropdownMenuItem>
            )
          )}
          {signedIn ? (
            <DropdownMenuItem className={item} onClick={() => setOpen(true)}>
              <MapIcon className="size-[18px]" />
              Add to a roadmap…
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem render={<Link href={loginPath(here)} />} className={item}>
              <MapIcon className="size-[18px]" />
              Sign in to add to a roadmap
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className={item} onClick={share}>
            <Share2 className="size-[18px]" />
            Share course
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {signedIn && (
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#0f1611]/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
            <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[min(520px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-card bg-surface p-[22px] text-ink shadow-[0_0_0_1px_var(--line),0_40px_80px_-30px_rgba(22,49,92,0.5)] outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Dialog.Title className="text-h3 font-medium">Add to a roadmap</Dialog.Title>
                  <Dialog.Description className="mt-1 text-[0.9rem] text-ink-soft">
                    <span className="line-clamp-1">{courseTitle}</span>
                    Pick a roadmap{roadmaps.some((r) => r.stages.length > 1) ? " and the stage it belongs in" : ""}.
                  </Dialog.Description>
                </div>
                <Dialog.Close render={<Button type="button" variant="outline" size="icon" className="size-11 shrink-0 rounded-full" aria-label="Close" />}>
                  <X aria-hidden="true" className="size-[18px]" />
                </Dialog.Close>
              </div>

              {roadmaps.length ? (
                <ul className="flex flex-col gap-2.5">
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
                <Dialog.Close render={<Button type="button" size="lg" variant="outline" />}>Done</Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}

function RoadmapRow({ roadmap: r, courseId }: { roadmap: RoadmapChoice; courseId: string }) {
  const [stageId, setStageId] = useState(r.stages.at(-1)?.id ?? "");
  const [pending, start] = useTransition();
  const stage = r.stages.find((s) => s.id === stageId);
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
          {/* One stage: nothing to choose. More: our own menu, not the browser's <select>. */}
          {r.stages.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Stage in ${r.title}: ${stage?.name ?? ""}`}
                className="inline-flex min-h-10 max-w-[190px] items-center gap-1.5 rounded-full bg-surface pr-2.5 pl-3.5 text-[0.88rem] text-ink shadow-[inset_0_0_0_1px_var(--line)] outline-none hover:bg-lime-soft/50 focus-visible:ring-2 focus-visible:ring-dusk data-popup-open:bg-lime-soft/50"
              >
                <span className="truncate">{stage?.name}</span>
                <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className={`z-[60] min-w-[200px] ${panel}`}>
                <DropdownMenuRadioGroup value={stageId} onValueChange={(v) => setStageId(String(v))}>
                  {r.stages.map((s, i) => (
                    <DropdownMenuRadioItem key={s.id} value={s.id} className={`${item} pr-9`}>
                      <span className="w-4 text-ink-soft tabular-nums">{i + 1}</span>
                      {s.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="text-[0.85rem] text-ink-soft">into {stage?.name}</span>
          )}
          <Button type="button" className="h-10 px-4" disabled={pending || !stageId} onClick={() => start(async () => void (await act(() => addCourseToStageAction(stageId, courseId), "Couldn't add the course to that roadmap.")))}>
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
