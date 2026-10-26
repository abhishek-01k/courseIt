import { Map as MapIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import StatusBadge from "@/components/status-badge";
import { roadmapPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import type { RoadmapSummary as Summary } from "../queries";

const plural = (n: number, one: string) => `${n.toLocaleString("en")} ${n === 1 ? one : `${one}s`}`;

// The cover: the roadmap's first courses, so every card has the same shape whatever its stages.
// 1 thumbnail fills it, 2 sit side by side, 3 are one big + two small, 4 make a 2×2 grid.
function Cover({ covers }: { covers: string[] }) {
  if (!covers.length) {
    return (
      <span className="flex h-full items-center justify-center bg-lime-soft text-pill-ink">
        <MapIcon aria-hidden="true" className="size-8 opacity-60" />
      </span>
    );
  }
  return (
    <span className={cn("grid h-full gap-0.5 bg-line", covers.length >= 2 && "grid-cols-2", covers.length >= 3 && "grid-rows-2")}>
      {covers.map((src, i) => (
        <span key={src + i} className={cn("relative overflow-hidden bg-lime-soft", covers.length === 3 && i === 0 && "row-span-2")}>
          <Image src={src} alt="" fill sizes="(min-width: 768px) 180px, 50vw" className="object-cover" />
        </span>
      ))}
    </span>
  );
}

// A roadmap in a grid (Roadmaps page and Community): cover, title, stages and courses, learners, your
// progress. Fixed parts only, so cards line up however many stages each roadmap has.
export default function RoadmapCard({ roadmap: r, variant }: { roadmap: Summary; variant: "mine" | "following" | "community" }) {
  return (
    <Link
      href={roadmapPath(r.slug)}
      className="flex w-full flex-col gap-3 rounded-card bg-surface p-2.5 shadow-[0_0_0_1px_var(--line)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_30px_60px_-30px_rgba(22,49,92,0.45),0_0_0_1px_var(--line)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span className="relative block aspect-video overflow-hidden rounded-2xl">
        <Cover covers={r.covers} />
        {variant === "mine" && (
          <StatusBadge tone={r.published ? "ok" : "idle"} className="absolute top-3 left-3 shadow-sm">
            {r.published ? "Public · in Community" : "Private"}
          </StatusBadge>
        )}
      </span>

      <span className="flex flex-1 flex-col gap-1.5 px-2.5 pb-2.5">
        <span className="line-clamp-2 font-display text-[1.35rem] leading-[1.2]">{r.title}</span>
        {variant !== "mine" && <span className="text-[0.88rem] text-ink-soft">by {r.author ?? "a learner"}</span>}
        <span className="text-[0.9rem] text-ink-soft tabular-nums">
          {plural(r.stages.length, "stage")} · {plural(r.courseCount, "course")}
        </span>
        <span className="text-[0.9rem] text-ink-soft tabular-nums">{plural(r.followers, "learner")}</span>

        <span className="mt-auto flex flex-col gap-2 border-t pt-3">
          <span className="flex justify-between gap-3 text-[0.88rem] text-ink-soft">
            Your progress
            <span className="font-medium text-ink tabular-nums">{r.pct}%</span>
          </span>
          <span className="block h-1.5 overflow-hidden rounded-full bg-lime-soft" role="progressbar" aria-label={`${r.title}: your progress`} aria-valuenow={r.pct} aria-valuemin={0} aria-valuemax={100}>
            <span className="block h-full rounded-full bg-moss" style={{ width: `${r.pct}%` }} />
          </span>
        </span>
      </span>
    </Link>
  );
}
