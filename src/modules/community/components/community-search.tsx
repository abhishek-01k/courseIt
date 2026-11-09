"use client";

import { Loader2, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

// Community's search box: results follow as you type, and any topic or language filter stays on.
export default function CommunitySearch({ initial, placeholder }: { initial: string; placeholder: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const search = (q: string) => {
    clearTimeout(timer.current);
    const next = new URLSearchParams(params);
    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");
    next.delete("show"); // a new search starts from the first page
    startTransition(() => router.replace(`/community?${next}`, { scroll: false }));
  };

  return (
    <form
      action="/community"
      onSubmit={(event) => {
        event.preventDefault();
        search(value);
      }}
      className="flex min-h-12 min-w-0 flex-[1_1_260px] items-center gap-2.5 rounded-full bg-surface px-4 text-ink-soft shadow-[0_0_0_1px_var(--line)]"
    >
      {pending ? <Loader2 aria-hidden="true" className="size-[18px] shrink-0 animate-spin" /> : <Search aria-hidden="true" className="size-[18px] shrink-0" />}
      <label htmlFor="community-search" className="sr-only">
        Search community
      </label>
      <input
        id="community-search"
        type="search"
        name="q"
        maxLength={80}
        value={value}
        onChange={(event) => {
          const q = event.target.value;
          setValue(q);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => search(q), 300);
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-ink outline-none"
      />
    </form>
  );
}
