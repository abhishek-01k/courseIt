"use client";

import { Check, RotateCcw, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { act } from "@/components/toaster";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types/lesson";
import { saveAnswerAction } from "../actions";

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

type QuizProps = {
  lessonStart: number; // the player shows time from the lesson's start, so the replay label does too
  questions: QuizQuestion[];
  initialAnswers: Record<string, number>;
  onReplay: (seconds: number) => void;
  onComplete?: () => void; // every question answered
};

// Instant feedback; answers save in the background and are checked on the server.
export default function Quiz({ lessonStart, questions, initialAnswers, onReplay, onComplete }: QuizProps) {
  const [picked, setPicked] = useState<Record<string, number>>(initialAnswers);
  const [, startSaving] = useTransition();
  const correct = questions.filter((q) => picked[q.id] === q.answerIndex).length;

  const answer = (questionId: string, index: number) => {
    const after = { ...picked, [questionId]: index };
    setPicked(after);
    if (questions.every((q) => q.id in after)) onComplete?.();
    startSaving(async () => void (await act(() => saveAnswerAction(questionId, index, Intl.DateTimeFormat().resolvedOptions().timeZone), "Couldn't save your answer.")));
  };
  const retry = (questionId: string) =>
    setPicked((p) => {
      const rest = { ...p };
      delete rest[questionId];
      return rest;
    });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-right font-mono text-label text-ink-soft tabular-nums">
        {correct} / {questions.length} right
      </p>
      {questions.map((q, n) => {
        const choice = picked[q.id];
        const done = choice !== undefined;
        const right = choice === q.answerIndex;
        return (
          <fieldset key={q.id} className="flex flex-col gap-2.5 rounded-card bg-paper p-5 shadow-[0_0_0_1px_var(--line)]">
            <legend className="sr-only">Question {n + 1}</legend>
            <p className="font-medium">
              <span className="text-ink-soft">{n + 1}. </span>
              {q.prompt}
            </p>
            {q.options.map((option, i) => (
              <button
                key={i}
                type="button"
                disabled={done}
                onClick={() => answer(q.id, i)}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-xl bg-surface px-3.5 py-2 text-left text-[0.92rem] shadow-[inset_0_0_0_1px_var(--line)] transition-colors enabled:hover:bg-lime-soft/50",
                  done && i === q.answerIndex && "bg-ok-bg text-ok-fg shadow-none",
                  done && i === choice && !right && "bg-err-bg text-err-fg shadow-none",
                )}
              >
                {done && i === q.answerIndex && <Check aria-hidden="true" className="size-4 shrink-0" />}
                {done && i === choice && !right && <X aria-hidden="true" className="size-4 shrink-0" />}
                {option}
              </button>
            ))}
            {done && (
              <div role="status" className="flex flex-col gap-2.5 pt-1">
                <p className="text-[0.88rem] text-ink-soft">
                  <strong className={cn("font-medium", right ? "text-ok-fg" : "text-err-fg")}>{right ? "Right. " : "Not quite. "}</strong>
                  {q.explanation}
                </p>
                {!right && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="lg" onClick={() => onReplay(q.replaySeconds)}>
                      <RotateCcw aria-hidden="true" />
                      Replay the moment · {clock(q.replaySeconds - lessonStart)}
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => retry(q.id)}>
                      Try again
                    </Button>
                  </div>
                )}
              </div>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
