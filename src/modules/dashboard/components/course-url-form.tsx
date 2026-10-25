"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { buildCourseAction } from "@/modules/course/actions";

export default function CourseUrlForm() {
  const [state, action, pending] = useActionState(buildCourseAction, {});

  return (
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
          aria-describedby={state.error ? "course-url-error" : undefined}
          className="min-h-12 min-w-0 flex-[1_1_240px] bg-transparent px-3.5 text-base text-ink outline-none placeholder:text-ink-soft/70"
        />
        <Button type="submit" size="lg" disabled={pending} className="flex-[1_1_auto] sm:flex-none">
          {pending ? "Checking the link…" : "Build my course"}
        </Button>
      </div>
      <p id="course-url-error" role="alert" className="text-[0.88rem] text-err-fg empty:hidden">
        {state.error}
      </p>
    </form>
  );
}
