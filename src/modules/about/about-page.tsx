import Link from "next/link";
import { LEGAL } from "@/lib/constants";
import { LegalSection } from "@/modules/legal/components/legal-document";

export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-[760px] px-6 pt-36 pb-[110px]">
      <h1 className="text-h1">
        About <em className="italic text-moss">CourseIt.</em>
      </h1>
      <p className="mt-5 text-[1.05rem] text-ink-soft">
        The best teachers in the world are on YouTube, for free. What YouTube doesn&apos;t give you is a course: a plan, a finish line, and a way to
        check you actually understood. CourseIt adds those, and nothing else.
      </p>
      <div className="mt-12 flex flex-col gap-10">
        <LegalSection title="How it works">
          <p>
            Paste a video or playlist. NVIDIA Nemotron models on Nebius Token Factory read the transcript, split it into lessons, and write study notes,
            quizzes and a placement test for each course. Videos play in YouTube&apos;s own player, so creators keep their views.
          </p>
        </LegalSection>
        <LegalSection title="Get in touch">
          <p>
            Questions, ideas or a course that didn&apos;t build right? Write to <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>, or{" "}
            <Link href="/new">build your first course</Link>.
          </p>
        </LegalSection>
      </div>
    </article>
  );
}
