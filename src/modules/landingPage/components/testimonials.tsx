import { TESTIMONIALS } from "@/lib/constants";
import SectionHeading from "./section-heading";

export default function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <SectionHeading label="Early testers" before="Learners who" accent="finished" after="." />
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {TESTIMONIALS.map((testimonial) => (
          <figure key={testimonial.id} className="flex flex-col justify-between gap-6 rounded-2xl border bg-card p-7">
            <blockquote className="font-serif text-3xl leading-tight">“{testimonial.quote}”</blockquote>
            <figcaption className="text-sm text-muted-foreground">
              {testimonial.name} · {testimonial.role}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
