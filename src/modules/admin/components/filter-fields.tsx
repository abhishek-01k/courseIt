"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { type LearnerFilter, PLANS, PRESETS } from "../learner-filter";

export const fieldInput =
  "w-full min-h-10 rounded-xl bg-paper px-3 py-2 text-[0.92rem] shadow-[inset_0_0_0_1px_var(--line)] outline-none focus:shadow-[inset_0_0_0_2px_var(--moss)]";
const fieldLabel = "flex flex-col gap-1 text-[0.82rem] font-medium text-ink-soft";
const check = "flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-paper px-3 text-[0.9rem] shadow-[inset_0_0_0_1px_var(--line)] has-checked:bg-lime-soft";

const same = (a: LearnerFilter, b: LearnerFilter) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The learner filter as form fields (their names are the filter keys), with presets that fill it in.
 * Lives inside a parent <form>: a GET form on Learners, the save form on Announcements.
 */
export default function FilterFields({
  initial,
  courseTitle,
  onChange,
}: {
  initial: LearnerFilter;
  courseTitle?: string | null;
  onChange?: (f: LearnerFilter) => void;
}) {
  const [f, setF] = useState<LearnerFilter>(initial);
  const update = (next: LearnerFilter) => {
    setF(next);
    onChange?.(next);
  };
  const set = <K extends keyof LearnerFilter>(k: K, v: LearnerFilter[K] | "" | undefined) => {
    const next = { ...f };
    if (v === "" || v == null || (typeof v === "number" && !(v > 0))) delete next[k];
    else next[k] = v as LearnerFilter[K];
    update(next);
  };
  const num = (k: "learned" | "away" | "minDays" | "minLessons" | "minHours" | "minStreak") => ({
    name: k,
    type: "number",
    min: 1,
    max: 3650,
    inputMode: "numeric" as const,
    value: f[k] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number.parseInt(e.target.value, 10) || undefined),
    className: fieldInput,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick filters">
        {PRESETS.map((p) => {
          const on = same({ ...p.filter, q: f.q, course: f.course }, f);
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={on}
              onClick={() => update(on ? { q: f.q, course: f.course } : { ...p.filter, ...(f.q && { q: f.q }), ...(f.course && { course: f.course }) })}
              className={cn(
                "inline-flex min-h-8 items-center rounded-full px-3 text-[0.82rem] shadow-[0_0_0_1px_var(--line)] hover:bg-lime-soft/60",
                on ? "bg-lime-soft font-medium text-pill-ink" : "bg-surface text-ink-soft",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <label className={cn(fieldLabel, "col-span-2")}>
          Name or email contains
          <input name="q" type="search" maxLength={80} value={f.q ?? ""} onChange={(e) => set("q", e.target.value.slice(0, 80))} className={fieldInput} />
        </label>
        <label className={fieldLabel}>
          Plan
          <select name="plan" value={f.plan ?? ""} onChange={(e) => set("plan", e.target.value as LearnerFilter["plan"])} className={fieldInput}>
            <option value="">Any</option>
            {Object.entries(PLANS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldLabel}>
          Built a course
          <select name="built" value={f.built ?? ""} onChange={(e) => set("built", e.target.value as LearnerFilter["built"])} className={fieldInput}>
            <option value="">Either</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className={fieldLabel}>
          Learned in the last … days
          <input {...num("learned")} placeholder="e.g. 7" />
        </label>
        <label className={fieldLabel}>
          Away for … days or more
          <input {...num("away")} placeholder="e.g. 14" />
        </label>
        <label className={fieldLabel}>
          Signed up from
          <input name="joinedFrom" type="date" value={f.joinedFrom ?? ""} onChange={(e) => set("joinedFrom", e.target.value)} className={fieldInput} />
        </label>
        <label className={fieldLabel}>
          Signed up until
          <input name="joinedTo" type="date" value={f.joinedTo ?? ""} onChange={(e) => set("joinedTo", e.target.value)} className={fieldInput} />
        </label>
        <label className={fieldLabel}>
          At least … active days
          <input {...num("minDays")} />
        </label>
        <label className={fieldLabel}>
          At least … lessons
          <input {...num("minLessons")} />
        </label>
        <label className={fieldLabel}>
          At least … hours watched
          <input {...num("minHours")} />
        </label>
        <label className={fieldLabel}>
          Streak of … days or more
          <input {...num("minStreak")} />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className={check}>
          <input type="checkbox" name="email" value="yes" checked={f.email === "yes"} onChange={(e) => set("email", e.target.checked ? "yes" : undefined)} className="accent-[var(--moss)]" />
          Can be emailed
        </label>
        <label className={check}>
          <input type="checkbox" name="admins" value="yes" checked={f.admins === "yes"} onChange={(e) => set("admins", e.target.checked ? "yes" : undefined)} className="accent-[var(--moss)]" />
          Admins only (dry run)
        </label>
        {f.course && (
          <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-lime-soft px-3 text-[0.9rem] text-pill-ink">
            <input type="hidden" name="course" value={f.course} />
            Taking {courseTitle ? `“${courseTitle}”` : "one course"}
            <button type="button" onClick={() => set("course", undefined)} aria-label="Remove course filter" className="rounded-full p-0.5 hover:bg-ink/10">
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
