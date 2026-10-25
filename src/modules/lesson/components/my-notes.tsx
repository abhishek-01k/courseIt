"use client";

import { useEffect, useRef, useState } from "react";
import { saveNoteAction } from "../actions";

// Your own notes on this lesson. Saves a second after you stop typing, and when you leave.
export default function MyNotes({ lessonId, initial }: { lessonId: string; initial: string }) {
  const [body, setBody] = useState(initial);
  const [status, setStatus] = useState<"saved" | "typing" | "saving">("saved");
  const latest = useRef(initial);
  const saved = useRef(initial);

  useEffect(() => {
    latest.current = body;
    if (body === saved.current) return;
    setStatus("typing");
    const timer = setTimeout(async () => {
      setStatus("saving");
      await saveNoteAction(lessonId, body);
      saved.current = body;
      setStatus("saved");
    }, 1000);
    return () => clearTimeout(timer);
  }, [body, lessonId]);

  useEffect(() => () => void (latest.current !== saved.current && saveNoteAction(lessonId, latest.current)), [lessonId]);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`note-${lessonId}`} className="sr-only">
        Your notes on this lesson
      </label>
      <textarea
        id={`note-${lessonId}`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write what clicked, what didn't, and what to look up later…"
        rows={10}
        className="w-full resize-y rounded-2xl bg-paper p-4 leading-relaxed text-ink shadow-[inset_0_0_0_1px_var(--line)] outline-none placeholder:text-ink-soft/70 focus-visible:ring-2 focus-visible:ring-dusk"
      />
      <span className="text-[0.8rem] text-ink-soft" aria-live="polite">
        {status === "saved" ? (body ? "Saved" : "") : status === "saving" ? "Saving…" : "Unsaved changes"}
      </span>
    </div>
  );
}
