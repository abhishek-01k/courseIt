"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

// Auth.js sends failed sign-ins back to /login?error=<code>; the reason shows as a toast.
export default function AuthError() {
  const error = useSearchParams().get("error");
  useEffect(() => {
    if (error) toast.error(error === "AccessDenied" ? "Access was denied. Try another account." : "Sign-in didn't work. Try again, or pick another provider.");
  }, [error]);
  return null;
}
