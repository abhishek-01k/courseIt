"use client";

import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { activeCount, filterParams, type LearnerFilter } from "../learner-filter";
import FilterFields from "./filter-fields";

const tidy = (params: Record<string, string | undefined>) =>
  new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1]))).toString();

// The Learners filter panel. Applying it rewrites the URL (only the filters that are on), so any view can be bookmarked.
export default function LearnersFilterForm({ initial, sort, courseTitle }: { initial: LearnerFilter; sort?: string; courseTitle?: string | null }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const on = activeCount(initial);
  const apply = (next: LearnerFilter) => {
    const qs = tidy({ ...filterParams(next), sort });
    router.push(qs ? `/admin/users?${qs}` : "/admin/users");
  };

  return (
    <details open={on > 0} className="group rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 px-4 font-medium [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal aria-hidden="true" className="size-[18px] text-ink-soft" />
        Filters
        {on > 0 && <span className="rounded-full bg-lime-soft px-2 py-0.5 font-mono text-[0.72rem] text-pill-ink tabular-nums">{on} on</span>}
        {initial.q && <span className="truncate text-[0.88rem] font-normal text-ink-soft">“{initial.q}”</span>}
        <span className="ml-auto text-[0.82rem] font-normal text-ink-soft group-open:hidden">Plan, activity, sign-up date, streaks…</span>
      </summary>
      <form
        className="flex flex-col gap-4 border-t border-line p-4"
        onSubmit={(e) => {
          e.preventDefault();
          apply(f);
        }}
      >
        <FilterFields initial={initial} courseTitle={courseTitle} onChange={setF} />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit">Apply filters</Button>
          {(on > 0 || initial.q) && (
            <Link href={sort ? `/admin/users?sort=${sort}` : "/admin/users"} className="px-3 text-[0.9rem] text-ink-soft hover:text-ink hover:underline">
              Clear all
            </Link>
          )}
        </div>
      </form>
    </details>
  );
}
