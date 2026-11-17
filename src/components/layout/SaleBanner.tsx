import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { paymentsLive, SALE, saleLive } from "@/lib/plans";

type Props = {
  // "fixed": pinned above the floating Navbar on the public and sign-in pages. It sets --sale-bar, which the Navbar
  // and the NVIDIA badge add to their top offset, and leaves a spacer so the page starts below it.
  // "inline": at the top of the signed-in app, scrolling away with the page.
  variant: "fixed" | "inline";
  href: string;
};

async function Bar({ variant, href }: Props) {
  await connection(); // the sale reads the clock, which Next only allows at request time
  if (!saleLive() || !paymentsLive()) return null;

  const bar = (
    <Link
      href={href}
      className="group flex h-9 w-full items-center justify-center gap-2 bg-ink px-3 text-[0.8rem] text-paper sm:px-4 sm:text-[0.85rem]"
    >
      <span className="shrink-0 whitespace-nowrap rounded-full bg-lime px-2 py-0.5 text-[0.75rem] font-semibold text-ink">{SALE.name}</span>
      {/* Phones get the short version so it fits on one line: "40% off your first month". Say "first month": the
          discount is one billing cycle, so a bare "40% off" would read as every month. */}
      <span className="truncate font-medium">
        {SALE.percent}% off your first month<span className="hidden sm:inline"> of Pro and Max, until {SALE.endsLabel}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 font-medium text-lime underline-offset-4 group-hover:underline">
        See plans <ArrowRight className="size-3.5" aria-hidden="true" />
      </span>
    </Link>
  );

  if (variant === "inline") return <div role="region" aria-label={`${SALE.name} sale`}>{bar}</div>;
  return (
    <>
      <style>{":root{--sale-bar:2.25rem}"}</style>
      <div aria-hidden="true" className="h-9 shrink-0" />
      <div role="region" aria-label={`${SALE.name} sale`} className="fixed inset-x-0 top-0 z-[70]">
        {bar}
      </div>
    </>
  );
}

/** The site-wide Black Friday alert (SALE in src/lib/plans.ts). Shows nothing outside the sale or before payments are live. */
export default function SaleBanner(props: Props) {
  return (
    <Suspense fallback={null}>
      <Bar {...props} />
    </Suspense>
  );
}
