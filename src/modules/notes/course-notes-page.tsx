import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import Thumbnail from "@/components/thumbnail";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { coursePath, lessonAt, lessonPath } from "@/lib/paths";
import { formatClock, timeAgo } from "@/lib/utils";
import { getCourseNotes } from "./queries";

// Storyboard frame 11, second view: one course's notes in lesson order. A note opens its lesson, where
// "My notes" is the open tab, so the learner reads and edits it next to the video.
export default async function CourseNotesPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, session] = await Promise.all([params, auth()]);
  if (!session?.user?.id) redirect("/login");
  const course = await getCourseNotes(session.user.id, slug);
  if (!course) notFound();
  const n = course.lessons.length;

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pt-8 pb-20 sm:px-6">
      <Link href="/notes" className="inline-flex items-center gap-2 self-start text-[0.9rem] text-ink-soft hover:text-ink">
        <ArrowLeft aria-hidden="true" className="size-4" />
        All notes
      </Link>

      <header className="flex flex-wrap items-center gap-[18px]">
        <span className="relative aspect-video w-[120px] shrink-0 overflow-hidden rounded-[14px] bg-lime-soft">
          <Thumbnail src={course.thumbnail} fill sizes="120px" className="object-cover" />
        </span>
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase tabular-nums">
            Notes · {course.count} in {n} {n === 1 ? "lesson" : "lessons"}
          </span>
          <h1 className="text-[clamp(1.8rem,3.6vw,2.4rem)] leading-[1.08]">
            <em className="italic text-moss">{course.title}</em>
          </h1>
          <span className="text-[0.9rem] text-ink-soft">{course.channel}</span>
        </div>
        <Link href={coursePath(course.slug)} className={buttonVariants({ variant: "outline", size: "lg" })}>
          Open course
        </Link>
      </header>

      {n ? (
        <ol className="flex flex-col gap-3">
          {course.lessons.map((lesson) => (
            <li key={lesson.id} className="flex flex-col gap-3 rounded-card bg-surface px-5 py-[18px] shadow-[0_0_0_1px_var(--line)]">
              <div className="flex flex-wrap items-center gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime-soft font-display text-pill-ink tabular-nums">
                  <span className="sr-only">Lesson </span>
                  {lesson.position + 1}
                </span>
                <span className="min-w-0 flex-[1_1_260px]">
                  <span className="block font-medium">{lesson.title}</span>
                  <span className="text-[0.82rem] text-ink-soft">Edited {timeAgo(lesson.edited)}</span>
                </span>
                <Link href={lessonPath(course.slug, lesson.position)} className="inline-flex min-h-11 items-center gap-1.5 text-[0.9rem] font-medium whitespace-nowrap text-moss underline-offset-4 hover:underline">
                  Open lesson
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
              {/* Each note's time opens the lesson at that moment. */}
              <ul className="flex flex-col gap-2 sm:ml-[54px]">
                {lesson.notes.map((note) => {
                  const time = formatClock(note.seconds - lesson.start);
                  return (
                    <li key={note.id} className="flex items-baseline gap-2.5">
                      <Link
                        href={lessonAt(course.slug, lesson.position, note.seconds)}
                        aria-label={`Open lesson ${lesson.position + 1} at ${time}`}
                        className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 font-mono text-[0.8rem] font-medium text-moss tabular-nums shadow-[inset_0_0_0_1px_var(--line)] hover:bg-lime-soft/60"
                      >
                        <Play aria-hidden="true" className="size-3 fill-current" />
                        {time}
                      </Link>
                      <span className="line-clamp-4 text-[0.95rem] whitespace-pre-line text-ink-soft">{note.body}</span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-ink-soft">No notes in this course yet. Write in “My notes” under any of its lessons.</p>
      )}
    </div>
  );
}
