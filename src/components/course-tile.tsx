import Image from "next/image";
import Link from "next/link";
import StatusBadge from "@/components/status-badge";
import { coursePath } from "@/lib/paths";
import { formatDuration } from "@/lib/utils";
import type { CourseTileData } from "@/types/course";

const STATUS = {
  queued: ["idle", "Queued"],
  reading: ["warn", "Building"],
  building: ["warn", "Building"],
  ready: ["ok", "Ready"],
  failed: ["err", "Failed"],
} as const;

// A built (or building) course: YouTube thumbnail, creator, length, and who added it to CourseIt.
export default function CourseTile({ course }: { course: CourseTileData }) {
  const [tone, label] = STATUS[course.status];
  return (
    <Link
      href={coursePath(course.slug)}
      className="flex w-full flex-col gap-3 rounded-card bg-surface p-2.5 shadow-[0_0_0_1px_var(--line)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_30px_60px_-30px_rgba(22,49,92,0.45),0_0_0_1px_var(--line)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-lime-soft">
        {course.thumbnail && <Image src={course.thumbnail} alt="" fill sizes="(min-width: 768px) 360px, 100vw" className="object-cover" />}
        {course.status !== "ready" && (
          <StatusBadge tone={tone} className="absolute top-3 left-3">
            {label}
          </StatusBadge>
        )}
        <span className="absolute right-3 bottom-3 rounded-full bg-white px-2.5 py-1.5 font-mono text-label tracking-[0.07em] text-[#0f1611] tabular-nums">
          {formatDuration(course.durationSeconds)}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 px-2 pb-2">
        <h3 className="line-clamp-2 text-h3 font-medium">{course.title}</h3>
        <span className="text-[0.9rem] font-medium">{course.channel}</span>
        {course.addedBy && (
          <span className="border-t pt-2.5 text-[0.85rem] text-ink-soft">
            added by <span className="font-medium text-ink">{course.addedBy.split(" ")[0]}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
