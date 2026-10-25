import { Map as MapIcon, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import CourseTile from "@/components/course-tile";
import EmptyState from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { countCommunityCourses, getCommunityCourses } from "@/modules/course/queries";
import RoadmapCard from "@/modules/roadmap/components/roadmap-card";
import { countPublishedRoadmaps, getPublishedRoadmaps } from "@/modules/roadmap/queries";

type Tab = "courses" | "roadmaps";
type Search = Promise<Record<string, string | string[] | undefined>>;

const read = async (searchParams: Search) => {
  const { tab, q } = await searchParams;
  return { tab: (tab === "roadmaps" ? "roadmaps" : "courses") as Tab, q: (typeof q === "string" ? q : "").trim().slice(0, 80) };
};

const href = (tab: Tab, q: string) => `/community?tab=${tab}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

async function Tabs({ searchParams }: { searchParams: Search }) {
  const [{ tab, q }, courses, roadmaps] = await Promise.all([read(searchParams), countCommunityCourses(), countPublishedRoadmaps()]);
  const tabs = [
    { id: "courses" as const, label: "Courses", n: courses },
    { id: "roadmaps" as const, label: "Roadmaps", n: roadmaps },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <nav aria-label="Show" className="inline-flex gap-1 rounded-full bg-surface p-1 shadow-[0_0_0_1px_var(--line)]">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={href(t.id, q)}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn("inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[0.88rem] font-medium transition-colors", tab === t.id ? "bg-moss text-on-moss" : "text-ink-soft hover:text-ink")}
          >
            {t.label}
            <span className="tabular-nums opacity-70">{t.n.toLocaleString("en")}</span>
          </Link>
        ))}
      </nav>
      <form action="/community" className="flex min-h-12 min-w-0 flex-[1_1_260px] items-center gap-2.5 rounded-full bg-surface px-4 text-ink-soft shadow-[0_0_0_1px_var(--line)] focus-within:ring-2 focus-within:ring-dusk">
        <input type="hidden" name="tab" value={tab} />
        <Search aria-hidden="true" className="size-[18px] shrink-0" />
        <label htmlFor="community-search" className="sr-only">
          Search community
        </label>
        <input
          key={`${tab}-${q}`}
          id="community-search"
          type="search"
          name="q"
          defaultValue={q}
          placeholder={tab === "courses" ? "Search courses or creators…" : "Search roadmaps, like “AI engineer”…"}
          className="min-w-0 flex-1 bg-transparent text-ink outline-none"
        />
      </form>
      <span className="text-[0.88rem] text-ink-soft">
        Sort: <span className="font-medium text-ink">{tab === "courses" ? "Most learners" : "Recently updated"}</span>
      </span>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: Search }) {
  const { tab, q } = await read(searchParams);

  if (tab === "roadmaps") {
    const roadmaps = await getPublishedRoadmaps(q);
    if (!roadmaps.length) {
      return (
        <EmptyState icon={MapIcon} title={q ? "No roadmaps match" : "No public roadmaps yet"} text={q ? `Nothing for “${q}”. Try another word.` : "Make a roadmap from courses you like and publish it. It shows up here for everyone."}>
          <Link href="/roadmaps" className={buttonVariants({ size: "lg" })}>
            Make a roadmap
          </Link>
        </EmptyState>
      );
    }
    return (
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-[18px]">
        {roadmaps.map((r) => (
          <li key={r.id} className="flex">
            <RoadmapCard roadmap={r} variant="community" />
          </li>
        ))}
      </ul>
    );
  }

  const courses = await getCommunityCourses(q);
  if (!courses.length) {
    return (
      <EmptyState icon={Users} title={q ? "No courses match" : "No courses yet"} text={q ? `Nothing for “${q}”. Try a creator's name or another topic.` : "Every course anyone builds shows up here, credited to its YouTube creator. Be the first."}>
        <Link href="/new" className={buttonVariants({ size: "lg" })}>
          Build a course
        </Link>
      </EmptyState>
    );
  }
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-[18px]">
      {courses.map((course) => (
        <li key={course.id} className="flex">
          <CourseTile course={course} />
        </li>
      ))}
    </ul>
  );
}

const box = <div aria-hidden="true" className="h-64 rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]" />;

// Storyboard frame 9: every course anyone built and every published roadmap.
export default function CommunityPage({ searchParams }: { searchParams: Search }) {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-[22px] px-4 pt-8 pb-20 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Community</span>
          <h1 className="text-[clamp(2rem,4vw,2.6rem)] leading-[1.08]">
            Learn what others are <em className="italic text-moss">learning.</em>
          </h1>
        </div>
        <Link href="/roadmaps" className={buttonVariants({ size: "lg" })}>
          <Plus aria-hidden="true" />
          New roadmap
        </Link>
      </header>
      <Suspense fallback={<div aria-hidden="true" className="h-12 rounded-full bg-surface shadow-[0_0_0_1px_var(--line)]" />}>
        <Tabs searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={box}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
