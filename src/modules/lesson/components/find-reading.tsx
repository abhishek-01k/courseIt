"use client";

import { Loader2, Search } from "lucide-react";
import { useTransition } from "react";
import { act } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { findReadingAction } from "../actions";

// "Find further reading": searches the web for this lesson once (Tavily), then the links stay for everyone.
export default function FindReading({ lessonId }: { lessonId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={pending}
      className="gap-2 self-start"
      onClick={() => start(async () => void (await act(() => findReadingAction(lessonId), "Couldn't find further reading.")))}
    >
      {pending ? <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : <Search aria-hidden="true" className="size-4" />}
      {pending ? "Searching the web…" : "Find further reading"}
    </Button>
  );
}
