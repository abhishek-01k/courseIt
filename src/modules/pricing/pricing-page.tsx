import { Suspense } from "react";
import Pill from "@/components/pill";
import NvidiaInceptionBadge from "@/components/nvidia-inception-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentsLive } from "@/lib/billing";
import { currentRegion } from "@/lib/region";
import PlanCards from "./components/plan-cards";

// Prices follow the visitor's country, so this part is read per request.
async function RegionalPlanCards() {
  return <PlanCards region={await currentRegion()} live={paymentsLive()} />;
}

// Public /pricing. Buttons go to /api/billing/checkout, which asks signed-out visitors to sign in first.
export default function PricingPage() {
  return (
    <article className="mx-auto flex w-full max-w-[1080px] flex-col items-center px-4 pt-36 pb-[110px] sm:px-6">
      <Pill>Pricing</Pill>
      <h1 className="mt-4 text-center text-h1">
        Learn from any course. <em className="italic text-moss">Pay only to build new ones.</em>
      </h1>
      <p className="mt-5 max-w-[560px] text-center text-[1.05rem] text-ink-soft">
        Courses others share are always free to join. Plans are the hours of video you turn into new courses.
      </p>
      <Suspense fallback={<Skeleton className="mt-10 h-[600px] w-full rounded-card" />}>
        <RegionalPlanCards />
      </Suspense>
      <div className="mt-12 flex flex-col items-center gap-3 text-center text-[0.95rem] text-ink-soft sm:flex-row sm:gap-5 sm:text-left">
        <NvidiaInceptionBadge height={44} />
        <p className="max-w-[420px]">CourseIt is a member of the NVIDIA Inception program. Every course is built with NVIDIA Nemotron models.</p>
      </div>
      <section aria-labelledby="faq-title" className="mt-20 flex w-full max-w-[760px] flex-col gap-6">
        <h2 id="faq-title" className="text-h3 font-medium">
          Questions
        </h2>
        {[
          ["What uses my hours?", "Building a new course from a YouTube link nobody has shared yet. A 3-hour playlist uses 3 hours. If the course already exists, it opens instantly and uses nothing."],
          ["Is there a free plan?", "You can join and study any course someone has already built for free, with no plan at all. Building new courses starts with Basic."],
          ["How many courses is that?", "The typical course built on CourseIt is about 5½ hours of video. So Basic covers one shorter course a month, Pro about 3 to 4, and Max about 7."],
          ["When do my hours come back?", "Each build's hours come back 30 days after you build it."],
          ["What if a video is too long for my plan?", "We tell you before anything starts. Basic builds courses up to 5 hours, Pro up to 10 and Max up to 20. Nothing is used and nothing is charged."],
          ["Who can see the courses I build?", "On Pro and Max, every course you build is private: only you can see it, and it isn't listed in Community. You can make one public from its menu, but a public course can't be made private again. Courses built on Basic are shared in Community. Either way, only the video's own captions are reused to serve others."],
          ["What if a build fails?", "If it stops before any lesson is written, it doesn't use your hours. On every paid plan, Retry picks up where it stopped and keeps every lesson already written."],
          ["Can I cancel?", "Any time, from Settings → Manage billing. You keep your plan until the end of the period you paid for, and every course you built stays yours."],
          ["Who handles payments?", "Dodo Payments, our merchant of record. They take cards worldwide, handle sales tax and send an invoice for every payment. We never see your card details."],
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
