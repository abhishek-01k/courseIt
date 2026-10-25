import Landscape from "@/components/landscape";
import Pill from "@/components/pill";
import CourseUrlForm from "@/modules/dashboard/components/course-url-form";

// "New course" in the sidebar: one question, the link. Building opens the full-screen onboarding.
export default function NewCoursePage() {
  return (
    <div className="flex flex-1 flex-col px-4 pt-6 pb-10 sm:px-6">
      <section aria-labelledby="new-title" className="relative flex min-h-[560px] flex-1 items-center justify-center overflow-hidden rounded-panel px-4 py-12 shadow-blue sm:px-6">
        <Landscape scene="sunrise" className="dark:hidden" />
        <Landscape scene="night" className="hidden dark:block" />
        <div className="glass relative flex w-full max-w-[660px] flex-col items-center gap-5 rounded-[28px] px-5 py-9 text-center sm:px-10">
          <Pill>New course</Pill>
          <h1 id="new-title" className="text-[clamp(2rem,4vw,2.7rem)] leading-[1.08]">
            Paste a long video. <em className="italic text-moss">Get a course.</em>
          </h1>
          <p className="text-ink-soft">Any YouTube video or playlist, from a 20-minute talk to a 6-hour course.</p>
          <CourseUrlForm />
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Already built by someone? It opens instantly</span>
        </div>
      </section>
    </div>
  );
}
