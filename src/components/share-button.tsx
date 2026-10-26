"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Shares a page: the device's share sheet where there is one (phones), else copies the link. */
export async function sharePage(path: string, title: string) {
  const url = new URL(path, window.location.origin).toString();
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared" as const;
    } catch (error) {
      if ((error as Error).name === "AbortError") return "cancelled" as const; // closed the sheet
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied" as const;
}

export default function ShareButton({ path, title, label = "Share" }: { path: string; title: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      onClick={async () => {
        if ((await sharePage(path, title)) === "copied") {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Link copied" : label}</span>
    </Button>
  );
}
