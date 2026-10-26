import { Suspense } from "react";
import CourseTile from "@/components/course-tile";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { getPopularCourses } from "@/modules/course/queries";
import SectionHeading from "./section-heading";

// Real courses from Community, most-taken first. Each opens the course page (visitors can look before signing in).
async function Tiles() {
  const popular = await getPopularCourses();
  return (
    <RevealGroup className="mt-12 grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-5">
      {popular.map((course) => (
        <RevealItem key={course.id} className="flex">
          <CourseTile course={course} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

export default function PopularCourses() {
  return (
    <section id="courses" aria-labelledby="courses-title" className="scroll-mt-24 px-6 py-[110px]">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading id="courses-title" label="Popular courses" title="Courses learners are" accent="taking right now." />
        <Suspense fallback={<div aria-hidden="true" className="mt-12 h-80 rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]" />}>
          <Tiles />
        </Suspense>
      </div>
    </section>
  );
}
