import { BookOpen, Check, Flame, Play } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <article className={cn("flex flex-col justify-between gap-6 rounded-3xl border bg-card p-6", className)}>
      {children}
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}

const chip = "rounded-md border px-2.5 py-1 font-mono text-xs uppercase tracking-wider";

export default function FeaturesBento() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-24">
      <SectionHeading label="Features" before="Everything you need to" accent="finish" after=" that 6-hour course." />

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <Tile
          className="lg:col-span-2 lg:row-span-2"
          title="This 6-hour course is 2h 40m for you."
          description="A 2-minute placement test finds what you already know and takes those lessons out of your plan."
        >
          <div>
            <div className="flex flex-wrap items-baseline gap-4">
              <span className="text-3xl tracking-tight text-faint line-through">6h 02m</span>
              <span className="text-7xl font-semibold leading-none tracking-tighter text-primary sm:text-8xl">2h 40m</span>
            </div>
            <ul className="mt-6 text-sm">
              <li className="flex justify-between border-t py-2.5 text-faint">
                <span className="line-through">JSX basics</span>
                <span className="font-mono text-xs">KNOWN</span>
              </li>
              <li className="flex justify-between border-t py-2.5 text-faint">
                <span className="line-through">Components and props</span>
                <span className="font-mono text-xs">KNOWN</span>
              </li>
              <li className="flex justify-between border-t py-2.5">
                <span>State with useState</span>
                <span className="font-mono text-xs text-primary">LEARN</span>
              </li>
            </ul>
          </div>
        </Tile>

        <Tile title="Watch it or read it." description="Every lesson works as the video or as short study notes. Learn the way you like.">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2.5 font-medium text-primary">
              <Play className="size-4 fill-current" />
              Video
            </div>
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-muted-foreground">
              <BookOpen className="size-4" />
              Article
            </div>
          </div>
        </Tile>

        <Tile title="Quizzes for every section." description="Pass a quiz to count the day. A streak you can't fake.">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Flame className="size-6 text-flame" />
              <span className="text-2xl font-semibold tracking-tighter">7</span>
              <div className="ml-auto flex gap-1.5">
                {Array.from({ length: 7 }, (_, day) => (
                  <span key={day} className={cn("size-3 rounded-full", day < 6 ? "bg-flame" : "border-2 border-flame")} />
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
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted px-4 py-3.5 font-mono text-sm">
              <span className="text-primary">&gt;</span> youtube.com/playlist?list=…
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={chip}>14 lessons</span>
              <span className={chip}>48 concepts</span>
              <span className={chip}>42 quiz questions</span>
              <span className={chip}>6 days</span>
            </div>
          </div>
        </Tile>

        <Tile title="Learns your pace." description="15, 30 or 60 minutes a day: CourseIt tells you when you'll be done.">
          <PacePicker />
        </Tile>
      </div>
    </section>
  );
}
