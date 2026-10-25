"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import Pill from "@/components/pill";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitPlacementAction } from "../actions";

type Question = { id: string; prompt: string; options: string[]; covers: string };

const DONT_KNOW = -1;

// One question at a time. Answers are only graded on the server, after the last question.
export default function PlacementQuiz({ courseId, questions }: { courseId: string; questions: Question[] }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [pending, start] = useTransition();
  const q = questions[i];
  const choice = answers[q.id];
  const last = i === questions.length - 1;
  const pick = (value: number) => setAnswers((a) => ({ ...a, [q.id]: value }));

  const option = (selected: boolean) =>
    cn(
      "flex min-h-14 w-full items-center gap-3.5 rounded-2xl bg-surface px-4 py-3 text-left text-[1rem] leading-snug transition-shadow",
      selected ? "shadow-[0_0_0_2px_var(--moss)]" : "shadow-[0_0_0_1px_var(--line)] hover:shadow-[0_0_0_1px_var(--moss)]",
    );
  const key = (selected: boolean) =>
    cn("flex size-7 shrink-0 items-center justify-center rounded-lg font-mono text-[0.8rem]", selected ? "bg-moss text-on-moss" : "bg-lime-soft text-pill-ink");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3.5">
        <span className="self-start">
          <Pill>
            Step 2 of 2 · Question {i + 1} of {questions.length}
          </Pill>
        </span>
        <div role="progressbar" aria-label="Test progress" aria-valuenow={i + 1} aria-valuemin={1} aria-valuemax={questions.length} className="flex gap-1.5">
          {questions.map((x, k) => (
            <span key={x.id} className={cn("h-1.5 flex-1 rounded-full", k < i || answers[x.id] !== undefined ? "bg-moss" : k === i ? "bg-ink-soft" : "bg-lime-soft")} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Covers: {q.covers}</span>
        <h1 className="text-[clamp(1.5rem,3.2vw,2.1rem)] leading-[1.15]">{q.prompt}</h1>
      </div>

      <div role="radiogroup" aria-label="Answers" className="flex flex-col gap-2.5">
        {q.options.map((text, k) => (
          <button key={k} type="button" role="radio" aria-checked={choice === k} onClick={() => pick(k)} className={option(choice === k)}>
            <span aria-hidden="true" className={key(choice === k)}>
              {"ABCD"[k]}
            </span>
            {text}
          </button>
        ))}
        <button type="button" role="radio" aria-checked={choice === DONT_KNOW} onClick={() => pick(DONT_KNOW)} className={cn(option(choice === DONT_KNOW), "bg-transparent text-ink-soft")}>
          <span aria-hidden="true" className={key(choice === DONT_KNOW)}>
            ?
          </span>
          I don&apos;t know this yet
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[0.88rem] text-ink-soft">No score to beat. &ldquo;I don&apos;t know this yet&rdquo; keeps those lessons in your plan.</span>
        <div className="flex gap-2">
          {i > 0 && (
            <Button size="lg" variant="outline" onClick={() => setI(i - 1)}>
              Back
            </Button>
          )}
          {last ? (
            <Button size="lg" disabled={choice === undefined || pending} onClick={() => start(() => submitPlacementAction(courseId, answers))}>
              {pending && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
              See my result
            </Button>
          ) : (
            <Button size="lg" disabled={choice === undefined} onClick={() => setI(i + 1)}>
              Next question
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
