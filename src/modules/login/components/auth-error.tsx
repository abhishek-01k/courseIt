"use client";

import { useSearchParams } from "next/navigation";

// Auth.js sends failed sign-ins back to /login?error=<code>.
export default function AuthError() {
  const error = useSearchParams().get("error");
  if (!error) return null;

  return (
    <p role="alert" className="w-full rounded-xl bg-err-bg px-4 py-3 text-[0.88rem] text-err-fg">
      {error === "AccessDenied" ? "Access was denied. Try another account." : "Sign-in didn't work. Please try again."}
    </p>
  );
}
