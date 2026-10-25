import { BookOpen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CourseTile from "@/components/course-tile";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getEnrolledCourses } from "@/modules/course/queries";

async function CourseList() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const courses = await getEnrolledCourses(session.user.id);

  if (!courses.length) {
    return (
      <EmptyState icon={BookOpen} title="No courses yet" text="Paste a YouTube video or playlist and it becomes a course with lessons, quizzes and a daily plan.">
        <Link href="/dashboard#course-url" className={buttonVariants({ size: "lg" })}>
          Build your first course
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

export default function CoursesPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-4 pt-8 pb-20 sm:px-6">
      <PageHeader label="My courses" title="Everything you're" accent="learning." />
      <Suspense fallback={<div aria-hidden="true" className="h-64 rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]" />}>
        <CourseList />
      </Suspense>
    </div>
  );
}
