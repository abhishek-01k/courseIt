import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";

type Labels = { signedIn: string; signedOut: string; className?: string };

async function Cta({ signedIn, signedOut, className }: Labels) {
  const session = await auth();
  return session?.user ? (
    <Link href="/dashboard" className={className}>
      {signedIn}
    </Link>
  ) : (
    <Link href="/login" className={className}>
      {signedOut}
    </Link>
  );
}

/**
 * "Start learning" for visitors, "Dashboard" once signed in. The session is read inside Suspense, so the
 * landing page itself stays static and fast; the button settles a moment later.
 */
export default function AuthCta({ signedIn, signedOut, className = buttonVariants({ size: "lg" }) }: Partial<Labels> & { signedIn: string; signedOut: string }) {
  return (
    <Suspense
      fallback={
        <Link href="/login" className={className}>
          {signedOut}
        </Link>
      }
    >
      <Cta signedIn={signedIn} signedOut={signedOut} className={className} />
    </Suspense>
  );
}
