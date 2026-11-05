import { Suspense } from "react";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { getPlatformStats } from "../queries";
import SectionHeading from "./section-heading";

// Never overstate: under 1,000 shows the exact count; above it, rounded down with a "+" (5,114 → "5,100+").
function figure(n: number) {
  if (n < 1000) return n.toLocaleString("en-US");
  const step = n < 10_000 ? 100 : 1000;
  return `${(Math.floor(n / step) * step).toLocaleString("en-US")}+`;
}

async function Tiles() {
  const s = await getPlatformStats();
  const tiles = [
    { value: figure(s.learners), label: "learners signed up", note: "Free to start, no card needed" },
    { value: figure(s.courses), label: "courses built", note: `${figure(s.publicCourses)} of them free for anyone to join` },
    { value: figure(s.videoHours), label: "hours of YouTube", note: "turned into short, structured lessons" },
    { value: figure(s.lessons), label: "lessons written", note: "with study notes from the video" },
    { value: figure(s.questions), label: "quiz questions", note: "each linked to the moment it's explained" },
    { value: figure(s.channels), label: "creators' channels", note: "from 20-minute talks to full bootcamps" },
  ];
  return (
    <RevealGroup stagger={0.06} className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {tiles.map((t) => (
        <RevealItem key={t.label} className="flex flex-col gap-1 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:p-6">
          <span className="font-display text-[clamp(2rem,5vw,3rem)] leading-none tracking-tight text-ink tabular-nums">{t.value}</span>
          <span className="mt-2 font-medium">{t.label}</span>
          <span className="text-[0.88rem] text-ink-soft">{t.note}</span>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

// Live figures, not marketing copy: they come from the database and refresh every hour (see getPlatformStats).
export default function Stats() {
  return (
    <section id="numbers" aria-labelledby="numbers-title" className="scroll-mt-24 px-6 py-[110px]">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading id="numbers-title" label="By the numbers" title="Real learners," accent="real courses." />
        <Suspense fallback={<div aria-hidden="true" className="mt-12 h-[340px] rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]" />}>
          <Tiles />
        </Suspense>
        <p className="mt-6 text-center text-[0.85rem] text-ink-soft">Counted live from CourseIt, updated every hour.</p>
      </div>
    </section>
  );
}
