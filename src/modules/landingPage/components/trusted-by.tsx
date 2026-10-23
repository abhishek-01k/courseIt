import CountUp from "@/components/motion/count-up";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { TOPICS, TRUST_STATS } from "@/lib/constants";
import SectionHeading from "./section-heading";

export default function TrustedBy() {
  return (
    <section aria-labelledby="trust-title" className="px-6 pt-[110px]">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading id="trust-title" label="Trusted by learners" title="48,000 learners." accent="9,200 courses finished." />

        <RevealGroup className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-4">
          {TRUST_STATS.map((stat) => (
            <RevealItem key={stat.id} className="ticket px-6 pt-[22px] pb-[26px]">
              <div className="font-mono text-label tracking-[0.07em] text-[#2e3524] uppercase">{stat.label}</div>
              <CountUp value={stat.value} className="mt-11 block font-display text-stat tracking-[-0.03em] tabular-nums" />
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="glass mt-[18px] flex flex-wrap items-center justify-between gap-x-7 gap-y-3.5 rounded-card px-7 py-[18px]">
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Learners use it for</span>
          {TOPICS.map((topic) => (
            <span key={topic} className="font-display text-[1.15rem] font-medium">
              {topic}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
