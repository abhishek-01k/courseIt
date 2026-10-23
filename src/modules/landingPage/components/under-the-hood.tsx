import { MODEL_ROLES, STATS } from "@/lib/constants";
import SectionHeading from "./section-heading";

export default function UnderTheHood() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-24">
      <SectionHeading label="Under the hood" before="Nemotron reads the video" accent="once" after=". Every feature comes from that." />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODEL_ROLES.map((role) => (
          <article key={role.id} className="space-y-3 rounded-2xl border bg-card p-6">
            <span className="inline-block rounded-md border px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {role.tag}
            </span>
            <h3 className="text-lg font-semibold tracking-tight">{role.title}</h3>
            <p className="text-sm text-muted-foreground">{role.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <div key={stat.id} className="rounded-2xl border bg-card p-6">
            <p className="text-4xl font-semibold tracking-tighter">{stat.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
