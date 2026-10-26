import { ArrowRight } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/status-badge";
import { roadmapPath } from "@/lib/paths";
import { formatDuration, timeAgo } from "@/lib/utils";
import type { RoadmapSummary as Summary } from "../queries";

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// A roadmap in a grid. "mine": visibility + your progress; "following": who made it + your progress;
// "community": who made it, creators, followers, Open.
export default function RoadmapCard({ roadmap: r, variant }: { roadmap: Summary; variant: "mine" | "following" | "community" }) {
  const facts = `${r.courseCount} ${r.courseCount === 1 ? "course" : "courses"}${r.seconds ? ` · ${formatDuration(r.seconds)} of video` : ""}`;
  const creators = r.creators.length > 3 ? `${r.creators.slice(0, 3).join(", ")} +${r.creators.length - 3}` : r.creators.join(", ");
  return (
    <Link
      href={roadmapPath(r.slug)}
      className="flex w-full flex-col gap-4 rounded-card bg-surface p-[22px] shadow-[0_0_0_1px_var(--line)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_30px_60px_-30px_rgba(22,49,92,0.45),0_0_0_1px_var(--line)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {variant === "mine" ? (
        <div className="flex items-center justify-between gap-2.5">
          <StatusBadge tone={r.published ? "ok" : "idle"}>{r.published ? "Public · in Community" : "Private"}</StatusBadge>
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Updated {timeAgo(r.updatedAt)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 text-[0.88rem] text-ink-soft">
          <span aria-hidden="true" className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-lime-soft font-display text-[0.7rem] text-pill-ink">
            {initials(r.author ?? "?")}
          </span>
          <span>
            roadmap by <span className="font-medium text-ink">{r.author ?? "a learner"}</span>
          </span>
        </div>
      )}

      <h3 className="font-display text-[1.7rem] leading-[1.12]">{r.title}</h3>

      {r.stages.length > 0 && (
        <ol className="flex flex-wrap items-center gap-1.5" aria-label="Stages">
          {r.stages.map((name, i) => (
            <li key={`${i}-${name}`} className="inline-flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-soft px-[11px] py-1.5 text-[0.8rem] font-medium text-pill-ink">
                <span className="tabular-nums opacity-65">{i + 1}</span>
                {name}
              </span>
              {i < r.stages.length - 1 && (
                <span aria-hidden="true" className="text-ink-soft">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      {variant !== "community" ? (
        <div className="mt-auto flex flex-col gap-2 border-t pt-3">
          <div className="flex justify-between gap-3 text-[0.88rem] text-ink-soft tabular-nums">
            <span>{facts}</span>
            <span>{r.pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-lime-soft" role="progressbar" aria-label={`${r.title} progress`} aria-valuenow={r.pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-moss" style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[0.85rem] text-ink-soft tabular-nums">
            <span>{facts}</span>
            {creators && <span>{creators}</span>}
          </div>
          <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3.5">
            <span className="text-[0.88rem] text-ink-soft tabular-nums">{r.followers ? `${r.followers.toLocaleString("en")} following` : `Updated ${timeAgo(r.updatedAt)}`}</span>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[0.88rem] font-medium shadow-[inset_0_0_0_1px_var(--line)]">
              Open roadmap
              <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </div>
        </>
      )}
    </Link>
  );
}
