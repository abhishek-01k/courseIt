"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { act } from "@/components/toaster";
import { Button, buttonVariants } from "@/components/ui/button";
import { buildCourseAction } from "@/modules/course/actions";
import type { BuildCourseState } from "@/types/course";

export type BuildBlock = { title: string; detail: string; upgrade: boolean };

// No builds left on the learner's plan (see buildBlock in src/lib/billing.ts): one calm panel with the reason
// and a way on, instead of a link box that can't be used. The server still checks every submit.
function Blocked({ title, detail, upgrade }: BuildBlock) {
  return (
    <div role="status" className="flex w-full flex-col items-center gap-3 rounded-[22px] bg-surface px-5 py-6 text-center shadow-[0_0_0_1px_var(--line)]">
      <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-lime-soft text-moss">
        <Lock className="size-[18px]" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-[1.05rem] font-medium">{title}</p>
        <p className="max-w-[420px] text-[0.92rem] text-ink-soft">{detail}</p>
      </div>
      <div className="mt-1 flex w-full flex-col justify-center gap-2 sm:w-auto sm:flex-row">
        {upgrade && (
          <Link href="/plans?reason=limit" className={buttonVariants({ size: "lg", className: "sm:min-w-[140px]" })}>
            Upgrade
          </Link>
        )}
        <Link href="/community" className={buttonVariants({ size: "lg", variant: "outline", className: "sm:min-w-[140px]" })}>
          Browse courses
        </Link>
      </div>
    </div>
  );
}

/** `caption`: a short line under the form (e.g. "Already built by someone? It opens instantly"), hidden when locked. */
export default function CourseUrlForm({ blocked, caption }: { blocked?: BuildBlock | null; caption?: string }) {
  const [state, action, pending] = useActionState<BuildCourseState, FormData>(
    async (prev, data) => (await act(() => buildCourseAction(prev, data), "Couldn't start your course.")) ?? prev,
    {},
  );

  if (blocked) return <Blocked {...blocked} />;

  return (
    <>
      <form action={action} className="flex w-full flex-col gap-2">
        <div className="flex w-full flex-wrap gap-2 rounded-[18px] bg-surface p-2 shadow-[0_0_0_1px_var(--line)]">
          <label htmlFor="course-url" className="sr-only">
            YouTube link
          </label>
          <input
            id="course-url"
            name="url"
            type="text"
            inputMode="url"
            required
            autoComplete="off"
            placeholder="youtube.com/playlist?list=…"
            aria-invalid={state.error ? true : undefined}
            className="min-h-12 min-w-0 flex-[1_1_240px] bg-transparent px-3.5 text-base text-ink outline-none placeholder:text-ink-soft/70"
          />
          <Button type="submit" size="lg" disabled={pending} className="flex-[1_1_auto] sm:flex-none">
            {pending ? "Checking the link…" : "Build my course"}
          </Button>
        </div>
      </form>
      {caption && <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">{caption}</span>}
    </>
  );
}
