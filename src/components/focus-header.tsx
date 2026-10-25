import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// Top bar of the full-screen steps (building, placement test, result): a way back, and one quiet action.
export default function FocusHeader({ backHref, backLabel, children }: { backHref: string; backLabel: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
      <Link href={backHref} className={buttonVariants({ variant: "outline", size: "lg" })}>
        <ArrowLeft aria-hidden="true" />
        {backLabel}
      </Link>
      {children}
    </header>
  );
}
