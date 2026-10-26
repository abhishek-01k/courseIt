import Link from "next/link";
import { LEGAL, SOCIAL_LINKS } from "@/lib/constants";
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
      <p className="mt-4 text-[1.05rem] text-ink-soft">
        CourseIt is a product of{" "}
        <a href={LEGAL.parent.url} target="_blank" rel="noreferrer">
          {LEGAL.parent.name}
        </a>
        , a small studio building simple, focused tools for learners and creators.
      </p>
      <div className="mt-12 flex flex-col gap-10">
        <LegalSection title="How it works">
          <p>
            Paste a video or playlist. NVIDIA Nemotron models on Nebius Token Factory read the transcript, split it into lessons, and write study notes,
            quizzes and a placement test for each course. Videos play in YouTube&apos;s own player, so creators keep their views.
          </p>
        </LegalSection>
        <LegalSection title="Who's building it">
          <p>
            I&apos;m Abhishek Kumar, a full-stack AI engineer from New Delhi. I built CourseIt because of Andrej Karpathy&apos;s &ldquo;Zero to
            Hero&rdquo; playlist: it sat in my Watch Later for months, I started it three times, and I never made it past video two. Forty minutes into
            &ldquo;Let&apos;s build GPT&rdquo;, YouTube would have me watching travel vlogs instead. The teaching was never the problem; the missing
            structure was.
          </p>
          <p>
            Before this I spent four years at Push Protocol, shipping the first cross-chain DEX on Push Chain, a yield product that held $16M+ in user
            funds, and a block explorer handling 10,000+ transactions a day. On weekends I won ten hackathons across Prague, Singapore and Bangkok. In
            2026 I left to start {LEGAL.parent.name}, where I build my own products solo and in public: Triggerfy&apos;s Instagram DM automation for
            creators, and now CourseIt.
          </p>
          <p>
            I share what I build, what works and what flops on{" "}
            {SOCIAL_LINKS.map(({ label, href }, i) => (
              <span key={label}>
                {i > 0 && (i === SOCIAL_LINKS.length - 1 ? " and " : ", ")}
                <a href={href} target="_blank" rel="noreferrer">
                  {label}
                </a>
              </span>
            ))}
            .
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
