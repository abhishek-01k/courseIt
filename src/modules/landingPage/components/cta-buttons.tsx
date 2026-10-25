import Link from "next/link";
import AuthCta from "@/components/layout/AuthCta";
import { buttonVariants } from "@/components/ui/button";

export default function CtaButtons() {
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      <AuthCta signedIn="Go to your dashboard" signedOut="Start learning" />
      <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg", className: "bg-glass" })}>
        Paste a link
      </Link>
    </div>
  );
}
