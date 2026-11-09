import { BookOpen, Lock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CourseTile from "@/components/course-tile";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { hasProPerks, usageFor } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { getEnrolledCourses } from "@/modules/course/queries";

type Search = Promise<Record<string, string | string[] | undefined>>;
type View = "all" | "private";

// My courses: everything the learner takes, with a toggle for the private ones they built (a Pro and Max perk).
async function CourseList({ searchParams }: { searchParams: Search }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const [{ view: raw }, all, usage] = await Promise.all([searchParams, getEnrolledCourses(userId), usageFor(userId)]);
  const view: View = raw === "private" ? "private" : "all";
  const privates = all.filter((c) => c.isPrivate);
  const shown = view === "private" ? privates : all;

  if (!all.length) {
    return (
      <EmptyState icon={BookOpen} title="No courses yet" text="Paste a YouTube video or playlist and it becomes a course with lessons, quizzes and a daily plan.">
        <Link href="/new" className={buttonVariants({ size: "lg" })}>
          Build your first course
        </Link>
      </EmptyState>
    );
  }

  const tabs = [
    { id: "all" as const, label: "All", n: all.length, href: "/courses" },
    { id: "private" as const, label: "Private", n: privates.length, href: "/courses?view=private" },
  ];

  return (
    <>
      <nav aria-label="Show" className="inline-flex gap-1 self-start rounded-full bg-surface p-1 shadow-[0_0_0_1px_var(--line)]">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-current={view === t.id ? "page" : undefined}
            className={cn("inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[0.88rem] font-medium transition-colors", view === t.id ? "bg-moss text-on-moss" : "text-ink-soft hover:text-ink")}
          >
            {t.id === "private" && <Lock aria-hidden="true" className="size-3.5" />}
            {t.label}
            <span className="tabular-nums opacity-70">{t.n}</span>
          </Link>
        ))}
      </nav>
      {shown.length ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-[18px]">
          {shown.map((course) => (
            <li key={course.id} className="flex">
              <CourseTile course={course} />
            </li>
          ))}
        </ul>
      ) : hasProPerks(usage) ? (
        <EmptyState icon={Lock} title="No private courses yet" text="On Pro and Max, every course you build is private: only you see it, and it isn't listed in Community.">
          <Link href="/new" className={buttonVariants({ size: "lg" })}>
            Build a private course
          </Link>
        </EmptyState>
      ) : (
        <EmptyState icon={Lock} title="Private courses come with Pro and Max" text="Keep the courses you build to yourself: only you see them, and they aren't listed in Community.">
          <Link href="/plans" className={buttonVariants({ size: "lg" })}>
            See plans
          </Link>
        </EmptyState>
      )}
    </>
  );
}

export default function CoursesPage({ searchParams }: { searchParams: Search }) {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-4 pt-8 pb-20 sm:px-6">
      <PageHeader label="My courses" title="Everything you're" accent="learning." />
      <Suspense fallback={<div aria-hidden="true" className="h-64 rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]" />}>
        <CourseList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
