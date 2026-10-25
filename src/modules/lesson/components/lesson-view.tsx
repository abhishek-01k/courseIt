"use client";

import { BookOpenCheck, ClipboardList, Layers, Loader2, NotebookPen, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FocusPlayerHandle, LessonViewProps } from "@/types/lesson";
import FocusPlayer from "./focus-player";
import MyNotes from "./my-notes";
import Quiz from "./quiz";
import UpNext, { AUTOPLAY_NEXT, useAutoplay } from "./up-next";

type Tab = "study" | "mine";

const tile = "flex min-h-11 flex-col items-start gap-0.5 rounded-2xl px-3 py-2.5 text-left";

// Focus mode, laid out like the original CourseIt: player and notes on the left; the day-by-day
// playlist and study tools on the right. The quiz opens in a dialog and can send the video back
// to the exact moment that explains a wrong answer.
export default function LessonView(props: LessonViewProps) {
  const { courseHref, lessonId, videoId, startSeconds, endSeconds, ready, writing, questions, initialAnswers, initialNote, next, day } = props;
  const nextHref = next?.href ?? null;
  const player = useRef<FocusPlayerHandle>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("mine");
  const [ended, setEnded] = useState(false);
  const [quizDone, setQuizDone] = useState(props.quizDone);
  const [autoplay, setAutoplay] = useAutoplay();
  const router = useRouter();
  // Arrived here by autoplay from the previous lesson: start playing straight away.
  const [autoStart] = useState(() => {
    try {
      const flag = typeof window !== "undefined" && sessionStorage.getItem(AUTOPLAY_NEXT) === "1";
      if (flag) sessionStorage.removeItem(AUTOPLAY_NEXT);
      return flag;
    } catch {
      return false;
    }
  });

  const openQuiz = () => dialog.current?.showModal();
  const replay = (seconds: number) => {
    dialog.current?.close();
    player.current?.playFrom(seconds);
  };
  const showTab = (t: Tab) => {
    setTab(t);
    tabs.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-5">
        <FocusPlayer
          ref={player}
          lessonId={lessonId}
          videoId={videoId}
          start={startSeconds}
          end={endSeconds}
          autoStart={autoStart}
          endScreen={
            ended && (
              <UpNext
                ready={ready}
                quizDone={quizDone}
                next={next}
                day={day}
                courseHref={courseHref}
                autoplay={autoplay}
                onTakeQuiz={openQuiz}
                onReplay={() => player.current?.playFrom(startSeconds)}
              />
            )
          }
          onPlay={() => setEnded(false)}
          onEnded={() => setEnded(true)}
          onWatched={() => router.refresh()} // ticks the lesson off in the playlist right away
        />

        <label className="-mt-2 flex cursor-pointer items-center justify-end gap-2.5 self-end text-[0.85rem] text-ink-soft">
          Autoplay next lesson
          <button
            type="button"
            role="switch"
            aria-checked={autoplay}
            onClick={() => setAutoplay(!autoplay)}
            className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", autoplay ? "bg-moss" : "bg-ink/15")}
          >
            <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left]", autoplay ? "left-4.5" : "left-0.5")} />
          </button>
        </label>


        {props.header}

        <div ref={tabs} className="flex scroll-mt-6 flex-col gap-4">
          <div role="tablist" aria-label="Notes" className="flex gap-6 border-b">
            {(
              [
                ["mine", "My notes"],
                ["study", "Study notes"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={cn("-mb-px min-h-11 border-b-2 px-0.5 text-[0.95rem]", tab === id ? "border-moss font-medium text-ink" : "border-transparent text-ink-soft hover:text-ink")}
              >
                {label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="panel-study" aria-labelledby="tab-study" hidden={tab !== "study"}>
            {props.studyNotes}
          </div>
          <div role="tabpanel" id="panel-mine" aria-labelledby="tab-mine" hidden={tab !== "mine"}>
            <MyNotes lessonId={lessonId} initial={initialNote} />
          </div>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-6 lg:h-[calc(100dvh-6.5rem)] lg:self-start">
        {props.playlist}

        <section aria-labelledby="tools-title" className="flex shrink-0 flex-col gap-2.5 rounded-card bg-surface p-3.5 shadow-[0_0_0_1px_var(--line)]">
          <h2 id="tools-title" className="px-1 font-display text-[1.05rem]">
            Study tools
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={openQuiz}
              disabled={!ready}
              className={cn(tile, "bg-lime-soft/60 transition-colors enabled:hover:bg-lime-soft disabled:opacity-70")}
            >
              {writing ? <Loader2 aria-hidden="true" className="size-4.5 animate-spin text-moss motion-reduce:animate-none" /> : <BookOpenCheck aria-hidden="true" className="size-4.5 text-moss" />}
              <span className="text-[0.92rem] font-semibold">Quiz</span>
              <span className="line-clamp-1 text-[0.75rem] leading-snug text-ink-soft">
                {ready ? `${questions.length} questions` : writing ? "Being written…" : "Not written yet"}
              </span>
            </button>
            <button type="button" onClick={() => showTab("mine")} className={cn(tile, "bg-lime-soft/60 transition-colors hover:bg-lime-soft")}>
              <NotebookPen aria-hidden="true" className="size-4.5 text-moss" />
              <span className="text-[0.92rem] font-semibold">My notes</span>
              <span className="line-clamp-1 text-[0.75rem] leading-snug text-ink-soft">Your own notes</span>
            </button>
            {(
              [
                [ClipboardList, "Day test", "The whole day"],
                [Layers, "Flashcards", "Key ideas"],
              ] as const
            ).map(([Icon, name, text]) => (
              <div key={name} aria-disabled="true" className={cn(tile, "border border-dashed")}>
                <span className="flex w-full items-center justify-between">
                  <Icon aria-hidden="true" className="size-4.5 text-ink-soft" />
                  <span className="rounded-full bg-idle-bg px-2 py-0.5 text-[0.72rem] text-idle-fg">Soon</span>
                </span>
                <span className="text-[0.92rem] font-semibold text-ink-soft">{name}</span>
                <span className="line-clamp-1 text-[0.75rem] leading-snug text-ink-soft">{text}</span>
              </div>
            ))}
          </div>
          {!ready && !writing && (
            <Link href={courseHref} className={buttonVariants({ size: "lg", variant: "outline" })}>
              Retry from the course page
            </Link>
          )}
        </section>
      </aside>

      <dialog
        ref={dialog}
        aria-labelledby="quiz-title"
        className="m-auto max-h-[88dvh] w-[min(640px,calc(100%-2rem))] overflow-y-auto rounded-panel bg-surface p-0 text-ink shadow-blue backdrop:bg-[#0f1611]/50 backdrop:backdrop-blur-sm"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-surface px-6 py-4">
          <h2 id="quiz-title" className="font-display text-[1.3rem]">
            Quiz
          </h2>
          <form method="dialog">
            <button type="submit" aria-label="Close quiz" className="flex size-11 items-center justify-center rounded-full hover:bg-lime-soft/60">
              <X aria-hidden="true" className="size-5" />
            </button>
          </form>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <p className="text-[0.9rem] text-ink-soft">Get one wrong and we&apos;ll replay the exact moment that explains it.</p>
          <Quiz lessonStart={startSeconds} questions={questions} initialAnswers={initialAnswers} onReplay={replay} onComplete={() => setQuizDone(true)} />
          {nextHref && (
            <Link href={nextHref} className={buttonVariants({ size: "lg" })}>
              Next lesson
            </Link>
          )}
        </div>
      </dialog>
    </div>
  );
}
