import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import BuildStatus from "./components/build-status";
import CourseHeader from "./components/course-header";
import LessonList from "./components/lesson-list";
import RefreshWhileBuilding from "./components/refresh-while-building";
import RetryBanner from "./components/retry-banner";
import { getPlacementResult, getPlacementTest } from "@/modules/placement/queries";
import { getCourseBySlug, getCoursePlan, getCourseSteps, touchEnrollment } from "./queries";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, session] = await Promise.all([params, auth()]);
  if (!session?.user?.id) redirect("/login");

  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const id = course.id;
  const userId = session.user.id;
  const [plan, steps, test, placement] = await Promise.all([getCoursePlan(userId, id), getCourseSteps(id), getPlacementTest(id), getPlacementResult(userId, id)]);
  after(() => touchEnrollment(userId, id)); // runs after the response, so it never slows the page

  const building = course.status !== "ready" && course.status !== "failed";

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6 px-4 pt-8 pb-20 sm:px-6">
      {building && <RefreshWhileBuilding />}
      <Link href="/courses" className="inline-flex items-center gap-2 self-start text-[0.9rem] text-ink-soft hover:text-ink">
        <ArrowLeft aria-hidden="true" className="size-4" />
        All courses
      </Link>
      <CourseHeader course={course} lessonCount={plan.lessons.length} />

      {building && <BuildStatus steps={steps} now={new Date()} />}

      {course.status === "failed" && (
        <RetryBanner courseId={course.id} message="Something went wrong while building this course. Retry picks up where it stopped." />
      )}
      {course.status === "ready" && course.error && (
        <RetryBanner courseId={course.id} message={`${course.error} The rest of the course is ready to use.`} />
      )}

      {plan.lessons.length > 0 && (
        <>
          {test.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-lime-soft px-5 py-4 text-pill-ink">
              <p className="text-[0.95rem]">
                {placement
                  ? `Placement test: ${placement.score} / ${placement.total}. Lessons you know are skipped in your plan.`
                  : "Already know some of this? A 2-minute test skips the lessons you know."}
              </p>
              <Link href={placement ? `/build/${slug}/result` : `/build/${slug}/test`} className={buttonVariants({ size: "lg" })}>
                {placement ? "See or change skipped lessons" : "Take the placement test"}
              </Link>
            </div>
          )}
          <section aria-labelledby="lessons-title" className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 id="lessons-title" className="text-[1.5rem]">Your plan</h2>
              <span className="ml-2 align-middle text-[0.9rem] text-ink-soft tabular-nums">
                {plan.lessons.filter((l) => l.done).length} / {plan.lessons.length} lessons done
              </span>
            </div>
            <LessonList slug={slug} plan={plan} building={building} />
          </section>
        </>
      )}
    </div>
  );
}
