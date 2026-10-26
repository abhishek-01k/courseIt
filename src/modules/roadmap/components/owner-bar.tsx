"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import Modal from "@/components/modal";
import { act } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { deleteRoadmapAction, type RoadmapFormState, setPublishedAction, updateRoadmapAction } from "../actions";

type Props = { id: string; title: string; description: string; published: boolean; admin: boolean };

const field = "rounded-[14px] bg-paper px-3.5 text-ink shadow-[inset_0_0_0_1px_var(--line)] outline-none focus-visible:ring-2 focus-visible:ring-dusk";

// The owner's buttons on a roadmap: Edit (name, description; a centered dialog) and Delete (asks first).
// Roadmaps are private; sharing the link lets others enroll. Admins also get Publish to Community.
export default function OwnerBar({ id, title, description, published, admin }: Props) {
  const [open, setOpen] = useState<"edit" | "delete" | null>(null);
  const [deleting, startDelete] = useTransition();
  const [publishing, startPublish] = useTransition();
  const [, action, saving] = useActionState<RoadmapFormState, FormData>(async (prev, formData) => {
    const next = (await act(() => updateRoadmapAction(id, prev, formData), "Couldn't save the roadmap.")) ?? prev;
    if (next.ok) setOpen(null);
    return next;
  }, {});
  const close = (o: boolean) => !o && setOpen(null);

  return (
    <>
      <Button type="button" size="lg" variant="outline" onClick={() => setOpen("edit")}>
        <Pencil aria-hidden="true" />
        Edit
      </Button>
      {admin && (
        <Button
          type="button"
          size="lg"
          disabled={publishing}
          onClick={() => startPublish(async () => void (await act(() => setPublishedAction(id, !published), published ? "Couldn't take it out of Community." : "Couldn't publish to Community.")))}
        >
          {publishing && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
          {published ? "Remove from Community" : "Publish to Community"}
        </Button>
      )}

      <Modal open={open === "edit"} onOpenChange={close} title="Edit roadmap">
        <form action={action} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.85rem] text-ink-soft">Name</span>
            <input name="title" defaultValue={title} required minLength={3} maxLength={80} autoFocus className={`${field} min-h-12`} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.85rem] text-ink-soft">What it’s for (optional)</span>
            <textarea name="description" defaultValue={description} maxLength={400} rows={3} className={`${field} py-2.5`} />
          </label>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="button" size="lg" variant="ghost" className="text-warn-fg" onClick={() => setOpen("delete")}>
              <Trash2 aria-hidden="true" />
              Delete roadmap
            </Button>
            <span className="ml-auto flex gap-2">
              <Button type="button" size="lg" variant="outline" onClick={() => setOpen(null)}>
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={saving}>
                {saving && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
                Save
              </Button>
            </span>
          </div>
        </form>
      </Modal>

      <Modal
        open={open === "delete"}
        onOpenChange={close}
        title={`Delete “${title}”?`}
        description="The roadmap and its stages are deleted. Its courses stay in My courses, with all your progress. A roadmap others are enrolled in can’t be deleted. This can’t be undone."
      >
        <div className="flex justify-end gap-2">
          <Button type="button" size="lg" variant="outline" onClick={() => setOpen(null)}>
            Keep it
          </Button>
          <Button type="button" size="lg" variant="destructive" disabled={deleting} onClick={() => startDelete(async () => void (await act(() => deleteRoadmapAction(id), "Couldn't delete the roadmap.")))}>
            {deleting && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
            Delete roadmap
          </Button>
        </div>
      </Modal>
    </>
  );
}
