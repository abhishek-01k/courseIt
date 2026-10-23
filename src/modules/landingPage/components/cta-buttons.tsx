import Link from "next/link";
import { Link2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CtaButtons() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "h-14 rounded-full px-7 text-base")}>
        <Link2 />
        Paste a link
      </Link>
      <Link
        href="/login"
        className={cn(buttonVariants(), "h-14 rounded-full bg-foreground px-8 text-base text-background hover:bg-foreground/85")}
      >
        Start learning
      </Link>
    </div>
  );
}
