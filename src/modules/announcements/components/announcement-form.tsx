"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { type AnnouncementFormState, saveAnnouncementAction } from "../actions";

type Sizes = Record<"all" | "free" | "paid" | "admins", { people: number; emails: number }>;
type Initial = { subject: string; heading: string; body: string; ctaLabel: string | null; ctaHref: string | null; audience: "all" | "free" | "paid" | "admins" };

const input = "w-full rounded-xl bg-paper px-3.5 py-2.5 text-[0.95rem] shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_2px_var(--moss)]";
const label = "flex flex-col gap-1.5 text-[0.88rem] font-medium";
const AUDIENCE = { all: "Everyone", free: "Free learners", paid: "Pro and Max", admins: "Admins only (dry run)" } as const;

// Write or edit a draft. Saving a new one opens it, with a preview and the send buttons.
export default function AnnouncementForm({ id, initial, sizes }: { id: string | null; initial?: Initial; sizes: Sizes }) {
  const [state, action, pending] = useActionState<AnnouncementFormState, FormData>(saveAnnouncementAction.bind(null, id), {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={label}>
        Email subject
        <input name="subject" required maxLength={150} defaultValue={initial?.subject} placeholder="Pro is here, and your free course" className={input} />
      </label>
      <label className={label}>
        Heading <span className="font-normal text-ink-soft">(the big line in the email, and the Inbox title)</span>
        <input name="heading" required maxLength={120} defaultValue={initial?.heading} placeholder="What's changing on CourseIt" className={input} />
      </label>
      <label className={label}>
        Message <span className="font-normal text-ink-soft">(plain text; leave a blank line between paragraphs)</span>
        <textarea name="body" required maxLength={5000} rows={9} defaultValue={initial?.body} className={`${input} resize-y leading-relaxed`} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Button label <span className="font-normal text-ink-soft">(optional)</span>
          <input name="ctaLabel" maxLength={40} defaultValue={initial?.ctaLabel ?? ""} placeholder="See plans" className={input} />
        </label>
        <label className={label}>
          Button link
          <input name="ctaHref" maxLength={300} defaultValue={initial?.ctaHref ?? ""} placeholder="/plans" className={input} />
        </label>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[0.88rem] font-medium">Send to</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(AUDIENCE) as (keyof typeof AUDIENCE)[]).map((a) => (
            <label key={a} className="flex cursor-pointer items-center gap-2 rounded-full bg-paper px-3.5 py-2 text-[0.9rem] shadow-[inset_0_0_0_1px_var(--line)] has-checked:bg-lime-soft has-checked:shadow-[inset_0_0_0_1px_var(--moss)]">
              <input type="radio" name="audience" value={a} defaultChecked={(initial?.audience ?? "all") === a} className="accent-[var(--moss)]" />
              {AUDIENCE[a]}
              <span className="font-mono text-[0.75rem] text-ink-soft tabular-nums">
                {sizes[a].people} · {sizes[a].emails} by email
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : id ? "Save changes" : "Save draft and preview"}
        </Button>
        {state.error && <p className="text-[0.9rem] text-destructive">{state.error}</p>}
        {state.ok && <p className="text-[0.9rem] text-moss">{state.ok}</p>}
      </div>
    </form>
  );
}
