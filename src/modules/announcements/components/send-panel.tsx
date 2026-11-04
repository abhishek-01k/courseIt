"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { type AnnouncementFormState, deleteDraftAction, sendAnnouncementAction, sendTestAction } from "../actions";

const people_ = (n: number) => `${n.toLocaleString("en")} ${n === 1 ? "person" : "people"}`;

// Test first, then send. Sending takes two clicks: the second one says exactly how many people it reaches.
export default function SendPanel({ id, people, emails }: { id: string; people: number; emails: number }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<AnnouncementFormState>({});
  const run = (fn: () => Promise<AnnouncementFormState | void>) => start(async () => setState((await fn()) ?? {}));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="lg" variant="outline" disabled={pending} onClick={() => run(() => sendTestAction(id))}>
          Send a test to me
        </Button>
        {confirming ? (
          <>
            <Button type="button" size="lg" disabled={pending} onClick={() => run(() => sendAnnouncementAction(id))}>
              {pending ? "Starting…" : `Yes, send to ${people_(people)}`}
            </Button>
            <Button type="button" size="lg" variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button type="button" size="lg" disabled={pending || people === 0} onClick={() => setConfirming(true)}>
            Send announcement
          </Button>
        )}
        <Button type="button" size="lg" variant="ghost" disabled={pending} onClick={() => run(() => deleteDraftAction(id))} className="ml-auto text-ink-soft">
          Delete draft
        </Button>
      </div>
      {confirming && (
        <p className="text-[0.9rem] text-ink-soft">
          {people_(people)} {people === 1 ? "gets" : "get"} it in their Inbox, and {emails.toLocaleString("en")} by email (the rest have no address, bounced or
          unsubscribed). This can&apos;t be undone.
        </p>
      )}
      {state.error && <p className="text-[0.9rem] text-destructive">{state.error}</p>}
      {state.ok && <p className="text-[0.9rem] text-moss">{state.ok}</p>}
    </div>
  );
}
