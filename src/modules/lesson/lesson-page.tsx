import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { cn, formatDuration } from "@/lib/utils";
import RefreshWhileBuilding from "@/modules/course/components/refresh-while-building";
import { coursePath, lessonPath } from "@/lib/paths";
import { getCourseBySlug, getCoursePlan, getLesson, getMyAnswers, getMyNote } from "@/modules/course/queries";
import CreatorCard, { CreatorCardFallback } from "./components/creator-card";
import LessonNotes from "./components/lesson-notes";
import LessonView from "./components/lesson-view";
import MarkComplete from "./components/mark-complete";
import Playlist from "./components/playlist";

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lesson: string }> }) {
  const [{ slug, lesson: number }, session] = await Promise.all([params, auth()]);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  if (!/^[1-9]\d{0,3}$/.test(number)) notFound();

  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const id = course.id;
  const [lesson, plan] = await Promise.all([getLesson(id, Number(number)), getCoursePlan(userId, id)]);
  if (!lesson) notFound();
  const lessonId = lesson.id;
  const [answers, note] = await Promise.all([getMyAnswers(userId, lessonId), getMyNote(userId, lessonId)]);

  const building = course.status !== "ready" && course.status !== "failed";
  const writing = !lesson.ready && building;
  const index = plan.lessons.findIndex((l) => l.id === lessonId);
  const me = plan.lessons[index];
  const prev = plan.lessons[index - 1];
  const next = plan.lessons[index + 1];
  const href = (l?: { position: number }) => (l ? lessonPath(slug, l.position) : null);

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-5 px-4 pt-5 pb-20 sm:px-6">
      {writing && <RefreshWhileBuilding />}
      <div className="flex items-center gap-3">
        <Link href={coursePath(slug)} className="inline-flex min-w-0 items-center gap-2 text-[0.9rem] text-ink-soft hover:text-ink">
          <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{course.title}</span>
        </Link>
        <span className="ml-auto shrink-0">
          <MarkComplete lessonId={lessonId} done={me?.done ?? false} nextHref={href(next)} courseHref={coursePath(slug)} />
        </span>
        <nav aria-label="Lessons" className="flex shrink-0 gap-1.5">
          <StepLink href={href(prev)} label="Previous lesson">
            <ChevronLeft />
          </StepLink>
          <StepLink href={href(next)} label="Next lesson">
            <ChevronRight />
          </StepLink>
        </nav>
      </div>

      <LessonView
        key={lessonId}
        courseId={id}
        courseHref={coursePath(slug)}
        lessonId={lessonId}
        videoId={lesson.videoId}
        startSeconds={lesson.startSeconds}
        endSeconds={lesson.endSeconds}
        ready={lesson.ready}
        writing={writing}
        questions={lesson.questions}
        initialAnswers={answers}
        initialNote={note}
        next={next ? { href: href(next)!, position: next.position, title: next.title, sameDay: next.day === me?.day, thumbnail: next.thumbnail } : null}
        day={me?.day ?? 1}
        quizDone={me?.quizDone ?? false}
        header={
          <header className="flex flex-col gap-1.5">
            <h1 className="text-[clamp(1.7rem,3.2vw,2.3rem)] leading-[1.1]">{lesson.title}</h1>
            <p className="text-[0.92rem] text-ink-soft">
              {formatDuration(lesson.endSeconds - lesson.startSeconds)} · {lesson.summary}
            </p>
            <div className="mt-2">
              <Suspense fallback={<CreatorCardFallback name={course.channel} />}>
                <CreatorCard videoId={lesson.videoId} />
              </Suspense>
            </div>
          </header>
        }
        studyNotes={
          lesson.notes ? (
            <LessonNotes markdown={lesson.notes} />
          ) : (
            <p className="flex items-center gap-2.5 text-ink-soft">
              {writing && <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />}
              {writing ? "Nemotron is writing the study notes for this lesson…" : "This lesson's notes couldn't be written yet. Retry from the course page; the video works meanwhile."}
            </p>
          )
        }
        playlist={<Playlist slug={slug} courseTitle={course.title} plan={plan} currentId={lessonId} />}
      />
    </div>
  );
}

function StepLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const look = buttonVariants({ variant: "outline", size: "icon-lg", className: "size-11" });
  return href ? (
    <Link href={href} aria-label={label} className={look}>
      {children}
    </Link>
  ) : (
    <span aria-disabled="true" aria-label={label} className={cn(look, "opacity-40")}>
      {children}
    </span>
  );
}
