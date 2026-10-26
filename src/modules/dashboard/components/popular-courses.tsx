import CourseTile from "@/components/course-tile";
import { getPopularCourses } from "@/modules/course/queries";

// For a new learner with nothing yet: real, ready courses from Community, most-taken first.
export default async function PopularCourses() {
  const popular = await getPopularCourses();
  if (!popular.length) return null;
  return (
    <section id="popular" aria-labelledby="popular-title" className="flex scroll-mt-20 flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="popular-title" className="text-[1.9rem] leading-[1.1]">
          No link handy? <em className="italic text-moss">Start with one of these.</em>
        </h2>
        <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Popular courses · ready now</span>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-[18px]">
        {popular.map((course) => (
          <li key={course.id} className="flex">
            <CourseTile course={course} />
          </li>
        ))}
      </ul>
    </section>
  );
}
