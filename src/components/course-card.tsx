import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PopularCourse } from "@/types/popular-courses";

// Shared by the landing page and the dashboard: thumbnail, title, channel, learners.
export default function CourseCard({ course, href }: { course: PopularCourse; href: string }) {
  return (
    <Link
      href={href}
      className="flex w-full flex-col rounded-card bg-surface p-2.5 shadow-[0_0_0_1px_var(--line)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_30px_60px_-30px_rgba(22,49,92,0.45),0_0_0_1px_var(--line)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className={cn("relative flex aspect-[16/10] items-center justify-center rounded-2xl", course.tone)}>
        <span aria-hidden="true" className="font-display text-[3.4rem]">
          {course.glyph}
        </span>
        {course.badge && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#f7e9da] px-[11px] py-[5px] text-[0.78rem] font-medium text-[#9a5a22]">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
            {course.badge}
          </span>
        )}
        <span className="absolute right-3 bottom-3 rounded-full bg-white px-2.5 py-1.5 font-mono text-label tracking-[0.07em] text-[#0f1611] tabular-nums">
          {course.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 px-3 pt-4 pb-3">
        <h3 className="text-h3 font-medium">{course.title}</h3>
        <span className="text-[0.9rem] text-ink-soft">from {course.channel}</span>
        <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">{course.meta}</span>
        <div className="mt-1.5 flex items-baseline justify-between border-t pt-3">
          <span className="text-[0.9rem] text-ink-soft tabular-nums">{course.learners} learning</span>
          <span className="font-display text-h3">Free</span>
        </div>
      </div>
    </Link>
  );
}
