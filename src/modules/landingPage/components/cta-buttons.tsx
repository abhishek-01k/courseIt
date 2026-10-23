import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function CtaButtons() {
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      <Link href="/login" className={buttonVariants({ size: "lg" })}>
        Start learning
      </Link>
      <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg", className: "bg-glass" })}>
        Paste a link
      </Link>
    </div>
  );
}
