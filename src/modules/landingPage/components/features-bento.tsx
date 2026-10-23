import { Check, Flame } from "lucide-react";
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
        <SectionHeading id="features-title" label="Features" title="Everything you need to" accent="finish that 6-hour course." />

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

          <Tile title="Watch it or read it." description="Every lesson works as the video or as short study notes.">
            <FormatToggle />
          </Tile>

          <Tile title="Quizzes for every section." description="Pass a quiz to count the day. A streak you can't fake.">
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <Flame className="size-6 text-warn-fg" />
                <span className="font-display text-[1.8rem] tabular-nums">7</span>
                <span className="text-[0.85rem] text-ink-soft">day streak</span>
                <div className="ml-auto flex gap-[5px]">
                  {Array.from({ length: 7 }, (_, day) => (
                    <span key={day} className={cn("size-[11px] rounded-full", day < 6 ? "bg-peach" : "shadow-[inset_0_0_0_2px_var(--peach)]")} />
                  ))}
                </div>
              </div>
            </div>
          </Tile>

          <Tile
            className="lg:col-span-2"
            title="Any YouTube video or playlist → a course in under a minute."
            description="Lessons, quizzes and a daily plan, built for you."
          >
            <div className="flex items-center gap-2.5 rounded-xl bg-surface px-4 py-3.5 font-mono text-[0.88rem] shadow-[inset_0_0_0_1px_var(--line)]">
              <span className="text-moss">›</span>
              <span className="min-w-0 flex-1 truncate">youtube.com/playlist?list=PLreact-from-zero</span>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <span className={tag}>14 lessons</span>
              <span className={tag}>48 concepts</span>
              <span className={tag}>42 quiz questions</span>
              <span className={tag}>6 days</span>
            </div>
          </Tile>

          <Tile title="Learns your pace." description="15, 30 or 60 minutes a day, and a date to finish by.">
            <PacePicker />
          </Tile>
        </RevealGroup>
      </div>
    </section>
  );
}
