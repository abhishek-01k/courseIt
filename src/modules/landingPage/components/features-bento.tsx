import { Play, Share2, Users } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import StatusBadge from "@/components/status-badge";
import { cn } from "@/lib/utils";
import FormatToggle from "./format-toggle";
import PacePicker from "./pace-picker";
import SectionHeading from "./section-heading";

type TileProps = {
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
};

function Tile({ title, description, className, children }: TileProps) {
  return (
    <RevealItem as="article" className={cn("flex flex-col justify-between gap-6 rounded-card bg-surface p-[26px] shadow-[0_0_0_1px_var(--line)]", className)}>
      <div>{children}</div>
      <div>
        <h3 className="text-h3 font-medium">{title}</h3>
        <p className="mt-1.5 text-[0.92rem] text-ink-soft">{description}</p>
      </div>
    </RevealItem>
  );
}

const tag = "rounded-full bg-lime-soft px-3 py-[7px] font-mono text-label tracking-[0.07em] text-pill-ink uppercase";

export default function FeaturesBento() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-24 px-6 py-[110px]">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading id="features-title" label="Features" title="Everything you need to" accent="finish that 6-hour playlist." />

        <RevealGroup className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Tile
            className="lg:col-span-2 lg:row-span-2"
            title="This 6-hour course is 2h 40m for you."
            description="A 2-minute placement test finds what you already know and takes those lessons out of your plan."
          >
            <div className="flex flex-wrap items-baseline gap-[18px]">
              <span className="font-display text-[2rem] text-ink-soft tabular-nums line-through opacity-60">6h 02m</span>
              <span className="font-display text-[clamp(4rem,9vw,7rem)] leading-[0.9] tracking-[-0.04em] text-moss tabular-nums">2h 40m</span>
            </div>
            <ul className="mt-7 text-[0.95rem]">
              <li className="flex justify-between gap-3 border-t py-3 text-ink-soft">
                <span className="line-through">JSX basics</span>
                <StatusBadge tone="ok">Known</StatusBadge>
              </li>
              <li className="flex justify-between gap-3 border-t py-3 text-ink-soft">
                <span className="line-through">Components and props</span>
                <StatusBadge tone="ok">Known</StatusBadge>
              </li>
              <li className="flex justify-between gap-3 border-t py-3">
                <span>State with useState</span>
                <StatusBadge tone="warn">To learn</StatusBadge>
              </li>
              <li className="flex justify-between gap-3 border-t py-3">
                <span>Effects with useEffect</span>
                <StatusBadge tone="warn">To learn</StatusBadge>
              </li>
            </ul>
          </Tile>

          <Tile title="Watch it, then read it." description="Distraction-free video for each lesson, plus study notes Nemotron writes from what was said.">
            <FormatToggle />
          </Tile>

          <Tile title="Miss one, replay the moment." description="Every lesson ends with a quiz. A wrong answer jumps the video to the moment that explains it.">
            <div className="flex flex-col gap-2.5 text-[0.88rem]">
              <p className="font-medium">Why does the same prompt give different answers?</p>
              <span className="rounded-xl bg-err-bg px-3 py-2 text-err-fg">The model forgets the prompt</span>
              <span className="inline-flex h-9 items-center gap-1.5 self-start rounded-full bg-moss px-3.5 font-medium text-on-moss">
                <Play aria-hidden="true" className="size-3 fill-current" />
                Replay 3:12 that explains it
              </span>
            </div>
          </Tile>

          <Tile
            className="lg:col-span-2"
            title="Any YouTube video or whole playlist → a course."
            description="Paste the link straight from YouTube. Lesson 1 is ready to watch while the rest is written."
          >
            <div className="flex items-center gap-2.5 rounded-xl bg-surface px-4 py-3.5 font-mono text-[0.88rem] shadow-[inset_0_0_0_1px_var(--line)]">
              <span className="text-moss">›</span>
              <span className="min-w-0 flex-1 truncate">youtube.com/watch?v=7AMjmCTumuo&amp;list=PL-osiE80TeTs…</span>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <span className={tag}>Playlists up to 20 hours</span>
              <span className={tag}>Notes + quiz per lesson</span>
              <span className={tag}>Day-by-day plan</span>
              <span className={tag}>Placement test</span>
            </div>
          </Tile>

          <Tile title="Your pace, every course." description="Set your daily time once. Every course splits into days, and skipped lessons drop out.">
            <PacePicker />
          </Tile>

          <Tile
            className="lg:col-span-2"
            title="Roadmaps: courses from many creators, in stages."
            description="Build your own path, publish it to the Community, share the link. Others follow it and track their own progress."
          >
            <ol className="flex flex-wrap items-center gap-2" aria-label="Example roadmap stages">
              {["Python", "Math for ML", "Machine learning", "Gen AI"].map((stage, i, all) => (
                <li key={stage} className="inline-flex items-center gap-2">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-[7px] text-[0.85rem] font-medium", i === 1 ? "bg-moss text-on-moss" : "bg-lime-soft text-pill-ink")}>
                    <span className="tabular-nums opacity-70">{i + 1}</span>
                    {stage}
                  </span>
                  {i < all.length - 1 && (
                    <span aria-hidden="true" className="text-ink-soft">
                      →
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap items-center gap-2.5 text-[0.88rem] text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <Users aria-hidden="true" className="size-4" /> 1,240 learners following
              </span>
              <span className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-full px-4 font-medium text-ink shadow-[inset_0_0_0_1px_var(--line)]">
                <Share2 aria-hidden="true" className="size-4" /> Share
              </span>
              <span className="inline-flex h-10 items-center rounded-full bg-moss px-4 font-medium text-on-moss">Follow roadmap</span>
            </div>
          </Tile>

          <Tile title="Notes pinned to the moment." description="Write while you watch. Each note keeps its time; click it and the video plays from there.">
            <ul className="flex flex-col gap-2 text-[0.88rem]">
              {[
                ["0:42", "Attention looks back, never ahead."],
                ["2:08", "MLP blocks hold most of the weights."],
                ["5:01", "Sampling explains different answers."],
              ].map(([time, text]) => (
                <li key={time} className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 font-mono text-[0.78rem] font-medium text-moss tabular-nums shadow-[inset_0_0_0_1px_var(--line)]">
                    <Play aria-hidden="true" className="size-3 fill-current" />
                    {time}
                  </span>
                  <span className="truncate text-ink-soft">{text}</span>
                </li>
              ))}
            </ul>
          </Tile>
        </RevealGroup>
      </div>
    </section>
  );
}
