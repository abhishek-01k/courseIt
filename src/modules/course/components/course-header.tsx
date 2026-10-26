import Thumbnail from "@/components/thumbnail";
import Pill from "@/components/pill";
import { formatDuration } from "@/lib/utils";
import type { getCourseBySlug } from "../queries";

type Course = NonNullable<Awaited<ReturnType<typeof getCourseBySlug>>>;

export default function CourseHeader({ course, lessonCount, menu }: { course: Course; lessonCount: number; menu?: React.ReactNode }) {
  const building = course.status !== "ready" && course.status !== "failed";
  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-5">
        <Thumbnail src={course.thumbnail} width={160} height={90} className="aspect-video w-40 rounded-2xl object-cover" />
        <div className="flex min-w-0 flex-[1_1_260px] flex-col items-start gap-2.5">
          <Pill>
            {course.channel} · {formatDuration(course.durationSeconds)}
            {lessonCount > 0 && ` · ${lessonCount} lessons`}
          </Pill>
          <h1 className="text-[clamp(1.9rem,4vw,2.5rem)] leading-[1.08]">
            {course.status === "failed" ? "We couldn't build " : building && !lessonCount ? "Building " : ""}
            <em className="italic text-moss">{course.title}</em>
          </h1>
        </div>
        {menu && <div className="self-start">{menu}</div>}
      </div>
      {building && (
        <div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-lime-soft" role="progressbar" aria-label="Course build progress" aria-valuenow={course.progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-moss transition-[width] duration-500" style={{ width: `${course.progress}%` }} />
          </div>
        </div>
      )}
    </header>
  );
}
