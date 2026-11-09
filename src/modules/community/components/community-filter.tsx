"use client";

import { Popover } from "@base-ui/react/popover";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type Option = { id: string; label: string; n: number };
type Draft = { lang: string[]; tag: string[] };

const list = (value: string | null) => (value ? value.split(",") : []);

function Group({ title, options, chosen, onChange }: { title: string; options: Option[]; chosen: string[]; onChange: (next: string[]) => void }) {
  return (
    <fieldset className="flex flex-col">
      <legend className="px-2 pb-1 text-[0.78rem] font-medium text-ink-soft">{title}</legend>
      {options.map((option) => (
        <label key={option.id} className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-[0.92rem] hover:bg-lime-soft/50">
          <input
            type="checkbox"
            className="size-4 accent-(--moss)"
            checked={chosen.includes(option.id)}
            onChange={(event) => onChange(event.target.checked ? [...chosen, option.id] : chosen.filter((id) => id !== option.id))}
          />
          {option.label}
          <span className="ml-auto text-[0.82rem] text-ink-soft tabular-nums">{option.n.toLocaleString("en")}</span>
        </label>
      ))}
    </fieldset>
  );
}

// The Filter button right of Community's search: tick any languages and topics, then Apply.
export default function CommunityFilter({ languages, topics }: { languages: Option[]; topics: Option[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const applied: Draft = { lang: list(params.get("lang")), tag: list(params.get("tag")) };
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(applied);
  const active = applied.lang.length + applied.tag.length;

  const apply = () => {
    const next = new URLSearchParams(params);
    for (const key of ["lang", "tag"] as const) {
      if (draft[key].length) next.set(key, draft[key].join(","));
      else next.delete(key);
    }
    next.delete("show"); // a new filter starts from the first page
    setOpen(false);
    startTransition(() => router.replace(`/community?${next}`, { scroll: false }));
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(applied); // ticks left without pressing Apply don't carry over
        setOpen(next);
      }}
    >
      <Popover.Trigger
        aria-label="Filter courses"
        className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center gap-2 rounded-full bg-surface px-3 text-[0.92rem] font-medium shadow-[0_0_0_1px_var(--line)] transition-colors hover:bg-lime-soft/50 sm:px-4"
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Filter</span>
        {active > 0 && <span className="grid size-5 place-items-center rounded-full bg-moss text-[0.72rem] text-on-moss tabular-nums">{active}</span>}
        <ChevronDown aria-hidden="true" className="hidden size-4 text-ink-soft sm:block" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={8} collisionPadding={16} className="isolate z-50">
          <Popover.Popup className="flex max-h-[min(var(--available-height),420px)] w-[270px] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_var(--line),0_12px_32px_rgba(0,0,0,0.16)] outline-none">
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-2.5">
              <Group title="Language" options={languages} chosen={draft.lang} onChange={(lang) => setDraft({ ...draft, lang })} />
              <div className="h-px shrink-0 bg-line" />
              <Group title="Topic" options={topics} chosen={draft.tag} onChange={(tag) => setDraft({ ...draft, tag })} />
            </div>
            <div className="flex shrink-0 gap-2 border-t border-line p-2.5">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDraft({ lang: [], tag: [] })}>
                Clear
              </Button>
              <Button type="button" className="flex-1" onClick={apply}>
                Apply
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
