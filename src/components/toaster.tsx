"use client";

import { unstable_rethrow } from "next/navigation";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

// Every error a learner sees shows here, bottom right, in the app's colors.
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      position="bottom-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      style={{ "--normal-bg": "var(--surface)", "--normal-text": "var(--ink)", "--normal-border": "var(--line)" } as React.CSSProperties}
    />
  );
}

/**
 * Runs a server action from the client. A returned `{ error }` and a failed request both show as a toast;
 * `fail` says what didn't happen. Redirects pass through. Returns the action's result, or null if it threw.
 */
export async function act<T>(run: () => Promise<T>, fail: string): Promise<T | null> {
  try {
    const result = await run();
    const error = (result as { error?: string } | undefined)?.error;
    if (error) toast.error(error);
    return result;
  } catch (error) {
    unstable_rethrow(error);
    console.error(error);
    toast.error(fail, { description: "Check your connection and try again." });
    return null;
  }
}
