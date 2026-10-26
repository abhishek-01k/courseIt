"use client";

import { Loader2, Plus } from "lucide-react";
import { useActionState } from "react";
import { act } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { createRoadmapAction, type RoadmapFormState } from "../actions";

export default function NewRoadmapForm() {
  const [state, action, pending] = useActionState<RoadmapFormState, FormData>(
    async (prev, data) => (await act(() => createRoadmapAction(prev, data), "Couldn't create the roadmap.")) ?? prev,
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:px-[22px]">
      <h2 className="text-h3 font-medium">Let&apos;s create a roadmap for you</h2>
      <div className="flex flex-wrap gap-2.5">
        <label className="flex min-w-0 flex-[1_1_320px] flex-col gap-1.5">
          <span className="text-[0.85rem] text-ink-soft">Private to you. Share the link and others can enroll</span>
          <input
            name="title"
            required
            minLength={3}
            maxLength={80}
            placeholder="e.g. Become an AI Engineer"
            aria-invalid={Boolean(state.error)}
            className="min-h-12 rounded-[14px] bg-paper px-3.5 text-ink shadow-[inset_0_0_0_1px_var(--line)] outline-none focus-visible:ring-2 focus-visible:ring-dusk"
          />
        </label>
        <Button type="submit" size="lg" disabled={pending} className="self-end">
          {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Plus aria-hidden="true" />}
          Create roadmap
        </Button>
      </div>
    </form>
  );
}
