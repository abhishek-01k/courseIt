"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import FilterFields from "@/modules/admin/components/filter-fields";
import { filterLabel, filterParams, type LearnerFilter } from "@/modules/admin/learner-filter";
import { type AnnouncementFormState, countAudienceAction, saveAnnouncementAction } from "../actions";

type Reach = { people: number; emails: number };
type Initial = { subject: string; heading: string; body: string; ctaLabel: string | null; ctaHref: string | null; filter: LearnerFilter };

const input = "w-full rounded-xl bg-paper px-3.5 py-2.5 text-[0.95rem] shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_2px_var(--moss)]";
const label = "flex flex-col gap-1.5 text-[0.88rem] font-medium";

/** Counts the filter's learners as it changes (debounced; a slower earlier answer never overwrites a newer one). */
function useReach(filter: LearnerFilter, initial: Reach) {
  const [reach, setReach] = useState<Reach | null>(initial);
  const latest = useRef(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const ticket = ++latest.current;
    setReach(null);
    const t = setTimeout(async () => {
      const r = await countAudienceAction(filterParams(filter)).catch(() => null);
      if (ticket === latest.current) setReach(r);
    }, 350);
    return () => clearTimeout(t);
  }, [filter]);
  return reach;
}

// Write or edit a draft. Saving a new one opens it, with a preview and the send buttons.
export default function AnnouncementForm({
  id,
  initial,
  filter: startFilter,
  reach: startReach,
  courseTitle,
}: {
  id: string | null;
  initial?: Initial;
  filter: LearnerFilter;
  reach: Reach;
  courseTitle?: string | null;
}) {
  const [state, action, pending] = useActionState<AnnouncementFormState, FormData>(saveAnnouncementAction.bind(null, id), {});
  const [filter, setFilter] = useState(startFilter);
  const reach = useReach(filter, startReach);
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
      <fieldset className="flex flex-col gap-3 rounded-[14px] bg-paper/60 p-3.5 shadow-[inset_0_0_0_1px_var(--line)]">
        <legend className="px-1 text-[0.88rem] font-medium">Send to</legend>
        <FilterFields initial={startFilter} courseTitle={courseTitle} onChange={setFilter} />
        <p aria-live="polite" className="rounded-xl bg-surface px-3.5 py-2.5 text-[0.9rem] shadow-[inset_0_0_0_1px_var(--line)]">
          <span className="font-medium">{filterLabel(filter, courseTitle)}</span>
          <span className="text-ink-soft tabular-nums">
            {" · "}
            {reach ? `${reach.people.toLocaleString("en")} ${reach.people === 1 ? "person" : "people"} in Inbox, ${reach.emails.toLocaleString("en")} by email` : "counting…"}
          </span>
        </p>
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
