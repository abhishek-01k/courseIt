import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { HOW_STEPS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import SectionHeading from "./section-heading";

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-24 px-6 py-[110px]">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading id="how-title" label="How it works" title="From a 6-hour video to" accent="a plan you finish." />

        <RevealGroup as="ol" stagger={0.15} className="mt-14 grid gap-7 md:grid-cols-3">
          {HOW_STEPS.map((step) => (
            <RevealItem as="li" key={step.id} className="flex flex-col gap-3.5">
              <span aria-hidden="true" className={cn("font-display text-[clamp(8rem,15vw,13rem)] leading-[0.8] tracking-[-0.06em] tabular-nums", step.numeralClass)}>
                {step.id}
              </span>
              <h3 className="text-h3 font-medium">{step.title}</h3>
              <p className="max-w-[340px] text-ink-soft">{step.description}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
