import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import BuildStatus from "./components/build-status";
import CourseHeader from "./components/course-header";
import LessonList from "./components/lesson-list";
import RefreshWhileBuilding from "./components/refresh-while-building";
import RetryBanner from "./components/retry-banner";
import PacePicker from "./components/pace-picker";
import { getCourseBySlug, getCoursePlan, getCourseSteps, touchEnrollment } from "./queries";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, session] = await Promise.all([params, auth()]);
  if (!session?.user?.id) redirect("/login");

  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const id = course.id;
  const userId = session.user.id;
  const [plan, steps] = await Promise.all([getCoursePlan(userId, id), getCourseSteps(id)]);
  after(() => touchEnrollment(userId, id)); // runs after the response, so it never slows the page

  const building = course.status !== "ready" && course.status !== "failed";

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6 px-4 pt-8 pb-20 sm:px-6">
      {building && <RefreshWhileBuilding />}
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
          <PacePicker courseId={course.id} minutesPerDay={plan.minutesPerDay} dayCount={plan.dayCount} />
          <section aria-labelledby="lessons-title" className="flex flex-col gap-4">
            <h2 id="lessons-title" className="text-[1.5rem]">
              Your plan
              <span className="ml-2 align-middle text-[0.9rem] text-ink-soft tabular-nums">
                {plan.lessons.filter((l) => l.done).length} of {plan.lessons.length} lessons done
                {building && " · Start watching now. Quizzes unlock as they're written."}
              </span>
            </h2>
            <LessonList slug={slug} plan={plan} building={building} />
          </section>
        </>
      )}
    </div>
  );
}
