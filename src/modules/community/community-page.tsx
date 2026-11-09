import { Map as MapIcon, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import CourseTile from "@/components/course-tile";
import EmptyState from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { COMMUNITY_PAGE, countCommunityCourses, getCommunityCourses, getCommunityFilters } from "@/modules/course/queries";
import { COURSE_LANGUAGES, COURSE_TAGS, isCourseLanguage, isCourseTag } from "@/lib/course-tags";
import CommunityFilter from "./components/community-filter";
import CommunitySearch from "./components/community-search";
import RoadmapCard from "@/modules/roadmap/components/roadmap-card";
import { countPublishedRoadmaps, getPublishedRoadmaps } from "@/modules/roadmap/queries";

type Tab = "courses" | "roadmaps";
type Search = Promise<Record<string, string | string[] | undefined>>;

const picked = (value: unknown) => (typeof value === "string" ? value.split(",") : []);

const read = async (searchParams: Search) => {
  const { tab, q, tag, lang, show } = await searchParams;
  return {
    // Courses open first; ?tab=roadmaps shows roadmaps.
    tab: (tab === "roadmaps" ? "roadmaps" : "courses") as Tab,
    q: (typeof q === "string" ? q : "").trim().slice(0, 80),
    tags: picked(tag).filter(isCourseTag) as string[],
    langs: picked(lang).filter(isCourseLanguage) as string[],
    show: Math.min(Math.max(Number(show) || COMMUNITY_PAGE, COMMUNITY_PAGE), 5000),
  };
};

type View = { q: string; tags?: string[]; langs?: string[]; show?: number };
const href = (tab: Tab, { q, tags = [], langs = [], show }: View) => {
  const params = new URLSearchParams({ tab });
  if (q) params.set("q", q);
  if (tags.length) params.set("tag", tags.join(","));
  if (langs.length) params.set("lang", langs.join(","));
  if (show) params.set("show", String(show));
  return `/community?${params}`;
};

async function Tabs({ searchParams }: { searchParams: Search }) {
  const [{ tab, q }, courses, roadmaps, counts] = await Promise.all([read(searchParams), countCommunityCourses(), countPublishedRoadmaps(), getCommunityFilters()]);
  // Only topics and languages that have courses; the button stays hidden until courses are tagged.
  const topics = COURSE_TAGS.filter((t) => counts.tags.has(t.id)).sort((a, b) => (a.id === "other" ? 1 : b.id === "other" ? -1 : counts.tags.get(b.id)! - counts.tags.get(a.id)!));
  const languages = COURSE_LANGUAGES.filter((l) => counts.languages.has(l.id)).map((l) => ({ ...l, n: counts.languages.get(l.id)! }));
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
            href={href(t.id, { q })}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn("inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[0.88rem] font-medium transition-colors", tab === t.id ? "bg-moss text-on-moss" : "text-ink-soft hover:text-ink")}
          >
            {t.label}
            <span className="tabular-nums opacity-70">{t.n.toLocaleString("en")}</span>
          </Link>
        ))}
      </nav>
      <div className="flex min-w-0 flex-[1_1_320px] items-center gap-2">
        <CommunitySearch key={tab} initial={q} placeholder={tab === "courses" ? "Search courses, topics or creators…" : "Search roadmaps, like “AI engineer”…"} />
        {tab === "courses" && topics.length > 0 && <CommunityFilter languages={languages} topics={topics.map((t) => ({ ...t, n: counts.tags.get(t.id)! }))} />}
      </div>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: Search }) {
  const { tab, q, tags, langs, show } = await read(searchParams);

  if (tab === "roadmaps") {
    const session = await auth();
    const roadmaps = await getPublishedRoadmaps(q, session?.user?.id);
    if (!roadmaps.length) {
      return (
        <EmptyState icon={MapIcon} title={q ? "No roadmaps match" : "No public roadmaps yet"} text={q ? `Nothing for “${q}”. Try another word.` : "Curated roadmaps show up here soon. Until then, make your own and share its link."}>
          <Link href="/roadmaps" className={buttonVariants({ size: "lg" })}>
            Make a roadmap
          </Link>
        </EmptyState>
      );
    }
    return (
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-[18px]">
        {roadmaps.map((r) => (
          <li key={r.id} className="flex">
            <RoadmapCard roadmap={r} variant="community" />
          </li>
        ))}
      </ul>
    );
  }

  const found = await getCommunityCourses({ q, tags, languages: langs, limit: show });
  const courses = found.slice(0, show);
  if (!courses.length) {
    const filtered = tags.length + langs.length > 0;
    return (
      <EmptyState icon={Users} title={q || filtered ? "No courses match" : "No courses yet"} text={q ? `Nothing for “${q}”. Try a creator's name or another topic.` : filtered ? "Try another topic or language." : "Every course anyone builds shows up here, credited to its YouTube creator. Be the first."}>
        {filtered ? (
          <Link href={href("courses", { q })} scroll={false} className={buttonVariants({ size: "lg" })}>
            Clear filters
          </Link>
        ) : (
          <Link href="/new" className={buttonVariants({ size: "lg" })}>
            Build a course
          </Link>
        )}
      </EmptyState>
    );
  }
  return (
    <>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-[18px]">
        {courses.map((course) => (
          <li key={course.id} className="flex">
            <CourseTile course={course} />
          </li>
        ))}
      </ul>
      {found.length > show && (
        <div className="flex justify-center">
          <Link href={href("courses", { q, tags, langs, show: show + COMMUNITY_PAGE })} scroll={false} className={buttonVariants({ variant: "outline", size: "lg" })}>
            Load more
          </Link>
        </div>
      )}
    </>
  );
}

const box = <div aria-hidden="true" className="h-64 rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]" />;

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
