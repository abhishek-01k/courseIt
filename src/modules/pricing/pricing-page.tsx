import { Suspense } from "react";
import Pill from "@/components/pill";
import { Skeleton } from "@/components/ui/skeleton";
import { currentRegion } from "@/lib/region";
import PlanCards from "./components/plan-cards";

// Prices follow the visitor's country, so this part is read per request.
async function RegionalPlanCards() {
  return <PlanCards region={await currentRegion()} />;
}

// Public /pricing. Buttons go to /api/billing/checkout, which asks signed-out visitors to sign in first.
export default function PricingPage() {
  return (
    <article className="mx-auto flex w-full max-w-[1080px] flex-col items-center px-4 pt-36 pb-[110px] sm:px-6">
      <Pill>Pricing</Pill>
      <h1 className="mt-4 text-center text-h1">
        Learn from any course. <em className="italic text-moss">Pay only to build new ones.</em>
      </h1>
      <p className="mt-5 max-w-[620px] text-center text-[1.05rem] text-ink-soft">
        Every course someone has already built is free to join, on every plan, forever. Your first <em>new</em> course from your own YouTube link is free;
        Pro and Max let you build more every month.
      </p>
      <Suspense fallback={<Skeleton className="mt-10 h-[600px] w-full rounded-card" />}>
        <RegionalPlanCards />
      </Suspense>
      <section aria-labelledby="faq-title" className="mt-20 flex w-full max-w-[760px] flex-col gap-6">
        <h2 id="faq-title" className="text-h3 font-medium">
          Questions
        </h2>
        {[
          ["What counts as a new course?", "Pasting a YouTube link nobody has built yet. If the course already exists, it opens instantly and doesn't count."],
          ["When does my limit reset?", "Free includes one course per account. On Pro and Max, each build counts for 30 days: a build from 30 days ago frees up its slot and its hours today."],
          ["What are hours of video?", "The total length of the videos you build courses from. A 3-hour playlist uses 3 of your monthly hours."],
          ["Can I cancel?", "Any time, from Settings → Manage billing. You keep your plan until the end of the period you paid for, and every course you built stays yours."],
          ["Who handles payments?", "Dodo Payments, our merchant of record. They take cards worldwide and handle sales tax and invoices."],
          ["Are taxes included?", "In India, prices include GST, and in the UK they include VAT. Elsewhere, prices are in US dollars and any sales tax or VAT is added at checkout."],
          ["Can I get a refund?", "Within 7 days of a charge if you haven't built a new course since. Email us and we reply within 3–5 working days. See the Refund policy."],
        ].map(([q, a]) => (
          <div key={q} className="flex flex-col gap-1.5">
            <h3 className="font-medium">{q}</h3>
            <p className="text-ink-soft">{a}</p>
          </div>
        ))}
      </section>
    </article>
  );
}
