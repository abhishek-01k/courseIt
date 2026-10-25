"use client";

import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { addCourseLinkAction, addStageAction, removeCourseAction, removeStageAction, type RoadmapFormState, renameStageAction } from "../actions";

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
  const [state, action, pending] = useActionState<RoadmapFormState, FormData>((prev, data) => addCourseLinkAction(stageId, prev, data), {});
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
      <p aria-live="polite" className={state.error ? "text-[0.85rem] text-warn-fg" : "sr-only"}>
        {state.error ?? (state.ok ? "Course added." : "")}
      </p>
    </form>
  );
}

export function AddStageForm({ roadmapId, next }: { roadmapId: string; next: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<RoadmapFormState, FormData>(async (prev, data) => {
    const result = await addStageAction(roadmapId, prev, data);
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
      {state.error && (
        <p role="alert" className="w-full text-[0.85rem] text-warn-fg">
          {state.error}
        </p>
      )}
    </form>
  );
}

/** Rename or remove a stage (owner only). Removing takes its courses off the roadmap, not out of My courses. */
export function StageControls({ stageId, name }: { stageId: string; name: string }) {
  const [mode, setMode] = useState<"idle" | "rename" | "remove">("idle");
  const [removing, startRemove] = useTransition();
  const [state, action, pending] = useActionState<RoadmapFormState, FormData>(async (prev, data) => {
    const result = await renameStageAction(stageId, prev, data);
    if (result.ok) setMode("idle");
    return result;
  }, {});

  if (mode === "rename") {
    return (
      <form action={action} className="flex w-full flex-wrap items-center gap-2">
        <label htmlFor={`rename-${stageId}`} className="sr-only">
          Stage name
        </label>
        <input id={`rename-${stageId}`} name="name" defaultValue={name} required maxLength={60} autoFocus className={`${field} flex-[1_1_200px]`} />
        <Button type="submit" className="h-11 px-4" disabled={pending}>
          Save
        </Button>
        <Button type="button" variant="ghost" className="h-11 px-4" onClick={() => setMode("idle")}>
          Cancel
        </Button>
        {state.error && <p className="w-full text-[0.85rem] text-warn-fg">{state.error}</p>}
      </form>
    );
  }
  if (mode === "remove") {
    return (
      <span className="inline-flex flex-wrap items-center gap-2 text-[0.88rem]">
        Remove “{name}”?
        <Button type="button" variant="destructive" className="h-10 px-3.5" disabled={removing} onClick={() => startRemove(() => removeStageAction(stageId))}>
          Remove
        </Button>
        <Button type="button" variant="ghost" className="h-10 px-3.5" onClick={() => setMode("idle")}>
          Keep
        </Button>
      </span>
    );
  }
  return (
    <span className="inline-flex gap-1">
      <Button type="button" variant="ghost" size="icon" className="size-10 rounded-full" aria-label={`Rename ${name}`} onClick={() => setMode("rename")}>
        <Pencil aria-hidden="true" className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-10 rounded-full" aria-label={`Remove ${name}`} onClick={() => setMode("remove")}>
        <Trash2 aria-hidden="true" className="size-4" />
      </Button>
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
      onClick={() => start(() => removeCourseAction(roadmapId, courseId))}
    >
      {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : <X aria-hidden="true" className="size-4" />}
    </Button>
  );
}
