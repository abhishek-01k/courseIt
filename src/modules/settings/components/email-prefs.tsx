"use client";

import { useOptimistic, useTransition } from "react";
import { cn } from "@/lib/utils";
import { setEmailNewsAction } from "../actions";

// Settings → Email. One switch for now: announcements. Account emails can't be turned off (they're about money
// and courses the learner is waiting for), and every message also lands in the Inbox either way.
export default function EmailPrefs({ news, email }: { news: boolean; email: string | null }) {
  const [on, setOn] = useOptimistic(news);
  const [, start] = useTransition();
  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)]">
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span className="flex flex-col gap-0.5">
          <span className="font-medium">Announcements and product news</span>
          <span className="text-[0.88rem] text-ink-soft">A few emails a month at most: new features and changes to plans.</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() =>
            start(async () => {
              setOn(!on);
              await setEmailNewsAction(!on);
            })
          }
          className={cn("relative h-6 w-[42px] shrink-0 rounded-full transition-colors", on ? "bg-moss" : "bg-ink/15")}
        >
          <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left]", on ? "left-[20px]" : "left-0.5")} />
        </button>
      </label>
      <p className="text-[0.85rem] text-ink-soft">
        {email ? (
          <>
            Emails go to <span className="text-ink">{email}</span>. Emails about your account (a course being ready, payments) always arrive, and
            everything also shows in your Inbox.
          </>
        ) : (
          "Your sign-in didn't share an email address, so messages only show in your Inbox."
        )}
      </p>
    </div>
  );
}
