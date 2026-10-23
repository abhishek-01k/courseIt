import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { TESTIMONIALS } from "@/lib/constants";
import SectionHeading from "./section-heading";

export default function Testimonials() {
  return (
    <section id="stories" aria-labelledby="stories-title" className="scroll-mt-24 px-6 py-[110px]">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading id="stories-title" label="Learners" title="People who" accent="actually finished." />

        <RevealGroup stagger={0.12} className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          {TESTIMONIALS.map((testimonial) => (
            <RevealItem as="figure" key={testimonial.id} className="flex flex-col justify-between gap-7 rounded-card bg-surface p-7 shadow-[0_0_0_1px_var(--line)]">
              <blockquote className="font-display text-h3 leading-[1.3]">“{testimonial.quote}”</blockquote>
              <figcaption className="flex flex-col gap-3.5">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-lime-soft font-display font-medium text-pill-ink">
                    {testimonial.initials}
                  </span>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-[0.88rem] text-ink-soft">{testimonial.role}</div>
                  </div>
                </div>
                <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">{testimonial.finished}</span>
              </figcaption>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
