"use client";

import { BookOpenCheck, Pause, PartyPopper, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LessonViewProps } from "@/types/lesson";

const KEY = "courseit:autoplay";
export const AUTOPLAY_NEXT = "courseit:autoplay-next"; // set just before moving on, read by the next lesson's player
const SECONDS = 7;

/** The learner's autoplay switch, remembered in this browser (on by default). */
export function useAutoplay() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    try {
      // Reading browser storage after mount (not during render) keeps server and client HTML identical.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOn(localStorage.getItem(KEY) !== "off");
    } catch {}
  }, []);
  const set = (value: boolean) => {
    setOn(value);
    try {
      localStorage.setItem(KEY, value ? "on" : "off");
    } catch {}
  };
  return [on, set] as const;
}

type UpNextProps = {
  ready: boolean; // the quiz exists
  quizDone: boolean;
  next: LessonViewProps["next"];
  day: number;
  courseHref: string;
  autoplay: boolean;
  onTakeQuiz: () => void;
  onReplay: () => void;
};

const big = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-[0.95rem] font-medium transition-colors";
const primary = `${big} bg-white text-[#0f1611] hover:bg-white/90`;
const ghost = `${big} bg-white/10 text-white hover:bg-white/20`;

/**
 * The end screen, shown in the video frame once a lesson has ended (the player is hidden by then):
 * - within the same day, "Next lesson in 7…" counts down straight away, with Take the quiz, Play next and
 *   Replay; clicking the countdown circle (it shows a pause icon on hover) or opening the quiz pauses it;
 * - at the end of the day it stops and says the day is done;
 * - after the last lesson, the course is finished.
 */
export default function UpNext({ ready, quizDone, next, day, courseHref, autoplay, onTakeQuiz, onReplay }: UpNextProps) {
  const router = useRouter();
  const [paused, setPaused] = useState(false);
  const [left, setLeft] = useState(SECONDS);

  const counting = !!next?.sameDay && autoplay && !paused;
  const takeQuiz = () => {
    setPaused(true); // the quiz is a choice to stay: stop counting down
    onTakeQuiz();
  };

  const go = () => {
    if (!next) return;
    try {
      sessionStorage.setItem(AUTOPLAY_NEXT, "1");
    } catch {}
    router.push(next.href);
  };

  useEffect(() => {
    if (!counting) return;
    if (left <= 0) return go();
    const timer = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  });

  const quizButton = ready && (
    <button type="button" onClick={takeQuiz} className={quizDone ? ghost : primary}>
      <BookOpenCheck aria-hidden="true" className="size-4" />
      {quizDone ? "Review the quiz" : "Take the quiz"}
    </button>
  );
  const replay = (
    <button type="button" onClick={onReplay} className={ghost}>
      <RotateCcw aria-hidden="true" className="size-4" />
      Replay
    </button>
  );

  return (
    <div role="status" aria-live="polite" className="relative flex size-full items-center justify-center overflow-hidden bg-[#0f1611] p-6 text-white">
      {next?.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element -- decorative, heavily dimmed backdrop
        <img src={next.thumbnail} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-25 blur-md" />
      )}
      <div className="relative flex max-w-[520px] flex-col items-center gap-4 text-center">
        {!next ? (
          <>
            <PartyPopper aria-hidden="true" className="size-10 text-[#b8c460]" />
            <p className="font-display text-[clamp(1.3rem,3vw,1.9rem)] leading-tight">That was the last lesson. Course finished!</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {quizButton}
              <Link href={courseHref} className={ghost}>
                See your course
              </Link>
              {replay}
            </div>
          </>
        ) : !next.sameDay ? (
          <>
            <PartyPopper aria-hidden="true" className="size-10 text-[#b8c460]" />
            <p className="font-display text-[clamp(1.3rem,3vw,1.9rem)] leading-tight">Day {day} done. That&apos;s your plan for today.</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {quizButton}
              <button type="button" onClick={go} className={ghost}>
                Start Day {day + 1} anyway
              </button>
              {replay}
            </div>
          </>
        ) : (
          <>
            <p className="text-[0.85rem] tracking-wide text-white/70 uppercase">{counting ? `Next lesson in ${left}` : paused ? "Paused · up next" : "Up next"}</p>
            <p className="line-clamp-2 font-display text-[clamp(1.2rem,2.6vw,1.7rem)] leading-tight">
              Lesson {next.position + 1}: {next.title}
            </p>
            {/* While counting, the circle pauses the countdown (pause icon on hover); once paused, it plays next. */}
            <button
              type="button"
              onClick={counting ? () => setPaused(true) : go}
              aria-label={counting ? `Pause the countdown (${left} seconds left)` : `Play lesson ${next.position + 1} now`}
              className="group relative my-1 flex size-20 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            >
              {counting ? (
                <>
                  <span className="font-display text-[2rem] leading-none tabular-nums group-hover:hidden group-focus-visible:hidden" aria-hidden="true">
                    {left}
                  </span>
                  <Pause aria-hidden="true" className="hidden size-8 fill-white group-hover:block group-focus-visible:block" />
                </>
              ) : (
                <Play aria-hidden="true" className="size-8 fill-white" />
              )}
              {counting && (
                <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90" aria-hidden="true">
                  <circle cx="40" cy="40" r="37" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                  <circle
                    cx="40"
                    cy="40"
                    r="37"
                    fill="none"
                    stroke="#b8c460"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 37}
                    strokeDashoffset={2 * Math.PI * 37 * (left / SECONDS)}
                    className="transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
                  />
                </svg>
              )}
            </button>
            <div className="flex flex-wrap justify-center gap-2.5">
              {quizButton}
              <button type="button" onClick={go} className={ready && !quizDone ? ghost : primary}>
                <Play aria-hidden="true" className="size-4" />
                Play next
              </button>
              {replay}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
