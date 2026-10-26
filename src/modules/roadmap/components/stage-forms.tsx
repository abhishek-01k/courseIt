"use client";

import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Modal from "@/components/modal";
import { act } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { addCourseLinkAction, addStageAction, moveStageAction, removeCourseAction, removeStageAction, type RoadmapFormState, renameStageAction } from "../actions";

const field = "min-h-11 min-w-0 rounded-xl bg-paper px-3 text-ink shadow-[inset_0_0_0_1px_var(--line)] outline-none focus-visible:ring-2 focus-visible:ring-dusk";

/** Empties a form once its action succeeds, so the next link can be pasted straight away. */
function useResetOnOk(ok: boolean | undefined) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (ok) ref.current?.reset();
  }, [ok]);
  return ref;
}

/** Paste a YouTube link into a stage: built courses are added at once, new ones start building. */
export function AddCourseForm({ stageId, stageName }: { stageId: string; stageName: string }) {
  const [state, action, pending] = useActionState<RoadmapFormState, FormData>(
    async (prev, data) => (await act(() => addCourseLinkAction(stageId, prev, data), "Couldn't add that course.")) ?? prev,
    {},
  );
  const ref = useResetOnOk(state.ok);
  const id = `add-${stageId}`;
  return (
    <form ref={ref} action={action} className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2 rounded-2xl p-1.5 shadow-[inset_0_0_0_1px_var(--line)]">
        <label htmlFor={id} className="sr-only">
          Add a course to {stageName}
        </label>
        <input
          id={id}
          name="url"
          type="url"
          required
          placeholder="Paste a YouTube video or playlist link"
          aria-invalid={Boolean(state.error)}
          className="min-h-10 min-w-0 flex-[1_1_220px] bg-transparent px-2.5 text-[0.92rem] text-ink outline-none"
        />
        <Button type="submit" variant="outline" className="h-10 px-4" disabled={pending}>
          {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Plus aria-hidden="true" />}
          {pending ? "Adding…" : "Add course"}
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {state.ok ? "Course added." : ""}
      </p>
    </form>
  );
}

export function AddStageForm({ roadmapId, next }: { roadmapId: string; next: number }) {
  const [open, setOpen] = useState(false);
  const [, action, pending] = useActionState<RoadmapFormState, FormData>(async (prev, data) => {
    const result = (await act(() => addStageAction(roadmapId, prev, data), "Couldn't add the stage.")) ?? prev;
    if (result.ok) setOpen(false);
    return result;
  }, {});
  if (!open) {
    return (
      <Button type="button" size="lg" variant="outline" className="self-start border border-dashed border-line shadow-none" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Add a stage
      </Button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2 rounded-card bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
      <label htmlFor="new-stage" className="sr-only">
        Stage name
      </label>
      <input id="new-stage" name="name" required maxLength={60} autoFocus placeholder={`Stage ${next}, e.g. “Math for ML”`} className={`${field} flex-[1_1_240px]`} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
        Add stage
      </Button>
      <Button type="button" size="lg" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}

/** ↑ ↓ beside a stage (owner only): swaps it with the stage above or below. */
export function StageMove({ stageId, name, first, last }: { stageId: string; name: string; first: boolean; last: boolean }) {
  const [moving, startMove] = useTransition();
  const icon = "size-10 rounded-full text-ink-soft";
  return (
    <div className="flex shrink-0 flex-col items-center gap-1 pt-4" aria-busy={moving}>
      <Button type="button" variant="ghost" size="icon" className={icon} aria-label={`Move ${name} up`} disabled={first || moving} onClick={() => startMove(async () => void (await act(() => moveStageAction(stageId, "up"), "Couldn't move the stage.")))}>
        <ArrowUp aria-hidden="true" className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className={icon} aria-label={`Move ${name} down`} disabled={last || moving} onClick={() => startMove(async () => void (await act(() => moveStageAction(stageId, "down"), "Couldn't move the stage.")))}>
        <ArrowDown aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

/**
 * Rename or remove a stage (owner only), each in a centered dialog. Removing takes its courses off the
 * roadmap, not out of My courses.
 */
export function StageControls({ stageId, name, courseCount }: { stageId: string; name: string; courseCount: number }) {
  const [open, setOpen] = useState<"rename" | "remove" | null>(null);
  const [removing, startRemove] = useTransition();
  const [, action, pending] = useActionState<RoadmapFormState, FormData>(async (prev, data) => {
    const result = (await act(() => renameStageAction(stageId, prev, data), "Couldn't rename the stage.")) ?? prev;
    if (result.ok) setOpen(null);
    return result;
  }, {});
  const close = (o: boolean) => !o && setOpen(null);

  return (
    <span className="inline-flex gap-1">
      <Button type="button" variant="ghost" size="icon" className="size-10 rounded-full" aria-label={`Rename ${name}`} onClick={() => setOpen("rename")}>
        <Pencil aria-hidden="true" className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-10 rounded-full" aria-label={`Remove ${name}`} onClick={() => setOpen("remove")}>
        <Trash2 aria-hidden="true" className="size-4" />
      </Button>

      <Modal open={open === "rename"} onOpenChange={close} title="Rename stage">
        <form action={action} className="flex flex-col gap-3">
          <label htmlFor={`rename-${stageId}`} className="text-[0.85rem] text-ink-soft">
            Stage name
          </label>
          <input id={`rename-${stageId}`} name="name" defaultValue={name} required maxLength={60} autoFocus className={field} />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" size="lg" variant="outline" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={open === "remove"}
        onOpenChange={close}
        title={`Remove “${name}”?`}
        description={
          courseCount
            ? `Its ${courseCount} ${courseCount === 1 ? "course comes" : "courses come"} off this roadmap. They stay in My courses, with all your progress.`
            : "This stage has no courses."
        }
      >
        <div className="flex justify-end gap-2">
          <Button type="button" size="lg" variant="outline" onClick={() => setOpen(null)}>
            Keep it
          </Button>
          <Button type="button" size="lg" variant="destructive" disabled={removing} onClick={() => startRemove(async () => void (await act(() => removeStageAction(stageId), "Couldn't remove the stage.")))}>
            {removing && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
            Remove stage
          </Button>
        </div>
      </Modal>
    </span>
  );
}

export function RemoveCourseButton({ roadmapId, courseId, title }: { roadmapId: string; courseId: string; title: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-10 shrink-0 rounded-full text-ink-soft"
      aria-label={`Remove ${title} from this roadmap`}
      disabled={pending}
      onClick={() => start(async () => void (await act(() => removeCourseAction(roadmapId, courseId), "Couldn't remove the course.")))}
    >
      {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : <X aria-hidden="true" className="size-4" />}
    </Button>
  );
}
