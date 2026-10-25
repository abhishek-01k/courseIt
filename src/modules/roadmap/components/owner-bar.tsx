"use client";

import { Loader2, Pencil } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteRoadmapAction, type RoadmapFormState, setPublishedAction, updateRoadmapAction } from "../actions";

type Props = { id: string; title: string; description: string; published: boolean };

const field = "rounded-[14px] bg-paper px-3.5 text-ink shadow-[inset_0_0_0_1px_var(--line)] outline-none focus-visible:ring-2 focus-visible:ring-dusk";

// The owner's buttons on a roadmap: Edit (name, description, delete) and Publish / Make private.
export default function OwnerBar({ id, title, description, published }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [publishing, startPublish] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [state, action, saving] = useActionState<RoadmapFormState, FormData>(async (prev, formData) => {
    const next = await updateRoadmapAction(id, prev, formData);
    if (next.ok) setEditing(false);
    return next;
  }, {});

  if (editing) {
    return (
      <form action={action} className="flex w-full flex-col gap-3 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)]">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] text-ink-soft">Name</span>
          <input name="title" defaultValue={title} required minLength={3} maxLength={80} className={`${field} min-h-12`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] text-ink-soft">What it’s for (optional)</span>
          <textarea name="description" defaultValue={description} maxLength={400} rows={3} className={`${field} py-2.5`} />
        </label>
        {state.error && (
          <p role="alert" className="text-[0.88rem] text-warn-fg">
            {state.error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="submit" size="lg" disabled={saving}>
            {saving && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
            Save
          </Button>
          <Button type="button" size="lg" variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <span className="ml-auto">
            {confirmDelete ? (
              <span className="inline-flex flex-wrap items-center gap-2 text-[0.88rem]">
                Delete this roadmap? Its courses stay in My courses.
                <Button type="button" size="lg" variant="destructive" disabled={deleting} onClick={() => startDelete(() => deleteRoadmapAction(id))}>
                  Delete
                </Button>
                <Button type="button" size="lg" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep it
                </Button>
              </span>
            ) : (
              <Button type="button" size="lg" variant="ghost" className="text-warn-fg" onClick={() => setConfirmDelete(true)}>
                Delete roadmap
              </Button>
            )}
          </span>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="lg" variant="outline" onClick={() => setEditing(true)}>
        <Pencil aria-hidden="true" />
        Edit
      </Button>
      <Button type="button" size="lg" disabled={publishing} onClick={() => startPublish(() => setPublishedAction(id, !published))}>
        {publishing && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
        {published ? "Make private" : "Publish to Community"}
      </Button>
    </div>
  );
}
