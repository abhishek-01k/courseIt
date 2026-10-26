"use client";

import { Clock, Loader2, Pencil, Play, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { act } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { cn, formatClock } from "@/lib/utils";
import { addNoteAction, deleteNoteAction, type Note, updateNoteAction } from "../actions";

type Props = {
  lessonId: string;
  start: number; // the lesson's start in the video; times show relative to it, like the player
  notes: Note[];
  setNotes: (update: (notes: Note[]) => Note[]) => void;
  now: () => number; // the video's position (seconds of the whole video)
  jump: (seconds: number) => void;
};

const field = "w-full resize-y rounded-2xl bg-paper px-4 py-3 leading-relaxed text-ink shadow-[inset_0_0_0_1px_var(--line)] outline-none placeholder:text-ink-soft/70 focus-visible:ring-2 focus-visible:ring-dusk";
const isSubmit = (e: React.KeyboardEvent) => e.key === "Enter" && (e.metaKey || e.ctrlKey);
const byTime = (a: Note, b: Note) => a.seconds - b.seconds;

// Storyboard 11b: notes pinned to moments of the video. The moment is taken when you start typing (or
// "Use the video's time now"); a note's time plays the video from there.
export default function MyNotes({ lessonId, start, notes, setNotes, now, jump }: Props) {
  const [body, setBody] = useState("");
  const [at, setAt] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [pending, startAdd] = useTransition();
  const label = at === null ? "the video’s time" : formatClock(at - start);

  const add = () => {
    const text = body.trim();
    if (!text || pending) return;
    const seconds = at ?? now();
    const temp: Note = { id: `temp-${Date.now()}`, seconds, body: text };
    setNotes((list) => [...list, temp].sort(byTime));
    setBody("");
    setAt(null);
    startAdd(async () => {
      const saved = await act(() => addNoteAction(lessonId, seconds, text), "Couldn't save your note.");
      setNotes((list) => (saved ? list.map((n) => (n.id === temp.id ? saved : n)).sort(byTime) : list.filter((n) => n.id !== temp.id)));
      setStatus(saved ? `Note added at ${formatClock(saved.seconds - start)}` : "");
      if (!saved) setBody(text);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-col gap-2.5 rounded-card bg-surface p-3.5 shadow-[0_0_0_1px_var(--line)]"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-lime-soft px-3 font-mono text-[0.82rem] font-medium text-pill-ink tabular-nums">
            <Clock aria-hidden="true" className="size-3.5" />
            at {label}
          </span>
          <button type="button" onClick={() => setAt(now())} className="min-h-9 text-[0.85rem] text-moss underline underline-offset-3 hover:text-moss-dark">
            Use the video’s time now
          </button>
        </div>
        <label htmlFor={`note-${lessonId}`} className="sr-only">
          Note at {label}
        </label>
        <textarea
          id={`note-${lessonId}`}
          value={body}
          rows={3}
          maxLength={5000}
          placeholder="What clicked at this moment? The time is taken when you start typing."
          onChange={(e) => {
            if (!body && at === null) setAt(now()); // first keystroke pins the moment
            setBody(e.target.value);
          }}
          onKeyDown={(e) => {
            if (isSubmit(e)) {
              e.preventDefault();
              add();
            }
          }}
          className={field}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.8rem] text-ink-soft" aria-live="polite">
            {status || "⌘ Enter to add"}
          </span>
          <Button type="submit" size="lg" disabled={!body.trim() || pending}>
            {pending && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
            Add note
          </Button>
        </div>
      </form>

      {notes.length > 0 ? (
        <ol className="flex flex-col gap-2.5" aria-label="Your notes on this lesson, in video order">
          {notes.map((n) => (
            <NoteRow key={n.id} note={n} start={start} jump={jump} setNotes={setNotes} />
          ))}
        </ol>
      ) : (
        <p className="text-[0.9rem] text-ink-soft">No notes yet. Pause on anything worth keeping and write it down; it stays pinned to that moment.</p>
      )}
    </div>
  );
}

function NoteRow({ note, start, jump, setNotes }: { note: Note; start: number; jump: (s: number) => void; setNotes: Props["setNotes"] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const [confirm, setConfirm] = useState(false);
  const [pending, startSave] = useTransition();
  const time = formatClock(note.seconds - start);
  const saving = note.id.startsWith("temp-");

  const save = () => {
    const text = draft.trim();
    setEditing(false);
    if (text === note.body) return;
    setNotes((list) => (text ? list.map((n) => (n.id === note.id ? { ...n, body: text } : n)) : list.filter((n) => n.id !== note.id)));
    startSave(async () => {
      if ((await act(() => updateNoteAction(note.id, text), "Couldn't save your note.")) === null) restore();
    });
  };
  const remove = () => {
    setNotes((list) => list.filter((n) => n.id !== note.id));
    startSave(async () => {
      if ((await act(() => deleteNoteAction(note.id), "Couldn't delete your note.")) === null) restore();
    });
  };
  // A failed save puts the note back as it was.
  const restore = () => setNotes((list) => [...list.filter((n) => n.id !== note.id), note].sort(byTime));
  const edit = () => {
    setDraft(note.body);
    setEditing(true);
  };

  return (
    <li className={cn("flex items-start gap-3 rounded-card bg-surface px-4 py-3.5 shadow-[0_0_0_1px_var(--line)]", (saving || pending) && "opacity-70")}>
      <button
        type="button"
        onClick={() => jump(note.seconds)}
        aria-label={`Play from ${time}`}
        className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 font-mono text-[0.82rem] font-medium text-moss tabular-nums shadow-[inset_0_0_0_1px_var(--line)] transition-colors hover:bg-lime-soft/60"
      >
        <Play aria-hidden="true" className="size-3 fill-current" />
        {time}
      </button>

      {editing ? (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label htmlFor={`edit-${note.id}`} className="sr-only">
            Edit note at {time}
          </label>
          <textarea
            id={`edit-${note.id}`}
            value={draft}
            autoFocus
            rows={3}
            maxLength={5000}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (isSubmit(e)) {
                e.preventDefault();
                save();
              } else if (e.key === "Escape") setEditing(false);
            }}
            className={field}
          />
          <div className="flex gap-2">
            <Button type="button" className="h-10 px-4" onClick={save}>
              Save
            </Button>
            <Button type="button" variant="ghost" className="h-10 px-4" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="min-w-0 flex-1 pt-1.5 text-[0.95rem] leading-relaxed whitespace-pre-line">{note.body}</p>
      )}

      {!editing && !saving && (
        <span className="flex shrink-0 items-center gap-0.5">
          {confirm ? (
            <>
              <Button type="button" variant="destructive" className="h-9 px-3" onClick={remove}>
                Delete
              </Button>
              <Button type="button" variant="ghost" className="h-9 px-3" onClick={() => setConfirm(false)}>
                Keep
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" size="icon" className="size-10 rounded-full text-ink-soft" aria-label={`Edit note at ${time}`} onClick={edit}>
                <Pencil aria-hidden="true" className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="size-10 rounded-full text-ink-soft" aria-label={`Delete note at ${time}`} onClick={() => setConfirm(true)}>
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </>
          )}
        </span>
      )}
    </li>
  );
}
