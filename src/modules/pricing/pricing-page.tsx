import Pill from "@/components/pill";
import PlanCards from "./components/plan-cards";

// Public /pricing. Buttons go to /api/billing/checkout, which asks signed-out visitors to sign in first.
export default function PricingPage() {
  return (
    <article className="mx-auto flex w-full max-w-[1080px] flex-col items-center px-4 pt-36 pb-[110px] sm:px-6">
      <Pill>Pricing</Pill>
      <h1 className="mt-4 text-center text-h1">
        Learn from any course. <em className="italic text-moss">Pay only to build new ones.</em>
      </h1>
      <p className="mt-5 max-w-[620px] text-center text-[1.05rem] text-ink-soft">
        Every course someone has already built is free to join, on every plan, forever. Plans set how many <em>new</em> courses you can build from
        your own YouTube links each month.
      </p>
      <PlanCards />
      <section aria-labelledby="faq-title" className="mt-20 flex w-full max-w-[760px] flex-col gap-6">
        <h2 id="faq-title" className="text-h3 font-medium">
          Questions
        </h2>
        {[
          ["What counts as a new course?", "Pasting a YouTube link nobody has built yet. If the course already exists, it opens instantly and doesn't count."],
          ["When does my limit reset?", "Each build counts for 30 days. A build from 30 days ago frees up a slot today."],
          ["Can I cancel?", "Any time, from Settings → Manage billing. You keep your plan until the end of the period you paid for, and every course you built stays yours."],
          ["Who handles payments?", "Dodo Payments, our merchant of record. They take cards worldwide and handle sales tax and invoices."],
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
