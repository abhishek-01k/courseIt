import { Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import CourseTile from "@/components/course-tile";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getCommunityCourses } from "@/modules/course/queries";

async function CommunityCourses() {
  const courses = await getCommunityCourses();

  if (!courses.length) {
    return (
      <EmptyState icon={Users} title="No courses yet" text="Every course anyone builds shows up here, credited to its YouTube creator. Be the first.">
        <Link href="/dashboard#course-url" className={buttonVariants({ size: "lg" })}>
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

// ponytail: Courses only; the Roadmaps tab, topic filters and search come with roadmaps.
export default function CommunityPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-4 pt-8 pb-20 sm:px-6">
      <PageHeader label="Community" title="Learn what others are" accent="learning." />
      <Suspense fallback={<div aria-hidden="true" className="h-64 rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]" />}>
        <CommunityCourses />
      </Suspense>
    </div>
  );
}
