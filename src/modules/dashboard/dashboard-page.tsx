import { Suspense } from "react";
import ContinueLearning from "./components/continue-learning";
import PopularCourses from "./components/popular-courses";
import StartCourse from "./components/start-course";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-4 pt-8 pb-20 sm:px-6">
      <Suspense>
        <ContinueLearning />
      </Suspense>
      <StartCourse />
      <PopularCourses />
    </div>
  );
}
