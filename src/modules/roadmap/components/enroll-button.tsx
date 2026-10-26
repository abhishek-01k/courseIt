"use client";

import { Check, Loader2, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { act } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { enrollRoadmapAction } from "../actions";

// Enroll in a shared or Community roadmap: it joins your Roadmaps under "Enrolled". Enrolled → hover/focus says Leave.
export default function EnrollButton({ roadmapId, enrolled }: { roadmapId: string; enrolled: boolean }) {
  const [pending, start] = useTransition();
  const [hover, setHover] = useState(false);
  const toggle = () =>
    start(async () => {
      await act(() => enrollRoadmapAction(roadmapId, !enrolled), enrolled ? "Couldn't leave the roadmap." : "Couldn't enroll you in this roadmap.");
    });
  if (!enrolled) {
    return (
      <Button type="button" size="lg" disabled={pending} onClick={toggle}>
        {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Plus aria-hidden="true" />}
        Enroll in roadmap
      </Button>
    );
  }
  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      disabled={pending}
      onClick={toggle}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-label="Enrolled. Leave this roadmap"
    >
      {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden="true" />}
      {hover ? "Leave roadmap" : "Enrolled"}
    </Button>
  );
}
