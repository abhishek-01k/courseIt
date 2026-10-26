"use client";

import { Check, Loader2, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { followRoadmapAction } from "../actions";

// Follow a published roadmap: it joins your Roadmaps under "Following". Following → hover/focus says Unfollow.
export default function FollowButton({ roadmapId, following }: { roadmapId: string; following: boolean }) {
  const [pending, start] = useTransition();
  const [hover, setHover] = useState(false);
  const toggle = () => start(() => followRoadmapAction(roadmapId, !following));
  if (!following) {
    return (
      <Button type="button" size="lg" disabled={pending} onClick={toggle}>
        {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Plus aria-hidden="true" />}
        Follow roadmap
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
      aria-label="Following. Unfollow this roadmap"
    >
      {pending ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Check aria-hidden="true" />}
      {hover ? "Unfollow" : "Following"}
    </Button>
  );
}
