import CourseCard from "@/components/course-card";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { POPULAR_COURSES } from "@/lib/constants";
import SectionHeading from "./section-heading";

export default function PopularCourses() {
  return (
    <section id="courses" aria-labelledby="courses-title" className="scroll-mt-24 px-6 py-[110px]">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading id="courses-title" label="Popular courses" title="Courses learners are" accent="finishing this week." />

        <RevealGroup className="mt-12 grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-5">
          {POPULAR_COURSES.map((course) => (
            <RevealItem key={course.id} className="flex">
              <CourseCard course={course} href="/login" />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
