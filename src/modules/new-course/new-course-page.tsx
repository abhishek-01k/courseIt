import Landscape from "@/components/landscape";
import Pill from "@/components/pill";
import { BUILDS_PAUSED_MESSAGE, buildsPaused } from "@/lib/builds-paused";
import BuildCourseForm from "@/modules/dashboard/components/build-course-form";

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
          <p className="text-ink-soft">Any YouTube video or playlist with captions, from a 20-minute talk to a full bootcamp.</p>
          {buildsPaused() && <p className="rounded-2xl bg-lime-soft px-4 py-2.5 text-[0.92rem] text-moss">{BUILDS_PAUSED_MESSAGE}</p>}
          <BuildCourseForm caption="Already built by someone? It opens instantly" />
        </div>
      </section>
    </div>
  );
}
