"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// A page that failed to load (usually the database or network). The toast says so; the page offers a retry.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
    toast.error("This page didn't load.", { description: "Check your connection and try again." });
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="text-[clamp(1.8rem,4vw,2.3rem)] leading-[1.1]">
        This page <em className="italic text-moss">didn&apos;t load.</em>
      </h1>
      <p className="text-ink-soft">Nothing you saved is lost. Try again in a moment.</p>
      <Button type="button" size="lg" onClick={retry}>
        <RotateCcw aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}
