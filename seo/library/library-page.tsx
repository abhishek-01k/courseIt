import Link from "next/link";
import Pill from "@/components/pill";
import { COURSE_LANGUAGES } from "@/lib/course-tags";
import { coursePath } from "@/lib/paths";
import { formatDuration } from "@/lib/utils";
import { getLibrary, type LibraryCourse, type LibraryTopic } from "./queries";

const languageLabel = (id: string | null) => (id && id !== "english" ? (COURSE_LANGUAGES.find((l) => l.id === id)?.label ?? null) : null);

/**
 * /library: every free public course, by topic, as plain links. It's the one public page that links to every course,
 * so search engines can reach them (Community is behind sign-in). Text only, no thumbnails, so it stays light.
 */
export default async function LibraryPage() {
  const { total, topics } = await getLibrary();
  return (
    <article className="mx-auto flex w-full max-w-[880px] flex-col px-4 pt-36 pb-[110px] sm:px-6">
      <Pill>Course library</Pill>
      <h1 className="mt-4 text-h1">
        Free courses built from <em className="italic text-moss">YouTube.</em>
      </h1>
      <p className="mt-5 text-[1.05rem] text-ink-soft">
        Every public course on CourseIt, in one place: {total} courses made from YouTube videos and playlists, each split into lessons with study
        notes, quizzes and a daily plan. Joining any of them is free. Videos play in YouTube&apos;s own player, so creators keep their views.
      </p>

      <nav aria-label="Topics" className="mt-8 flex flex-wrap gap-2">
        {topics.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="rounded-full bg-surface px-3.5 py-1.5 text-[0.88rem] text-ink-soft shadow-[inset_0_0_0_1px_var(--line)] hover:text-ink">
            {t.label} <span className="tabular-nums">({t.courses.length})</span>
          </a>
        ))}
      </nav>

      <div className="mt-12 flex flex-col gap-12">
        {topics.map((t) => (
          <Topic key={t.id} topic={t} />
        ))}
      </div>
    </article>
  );
}

function Topic({ topic }: { topic: LibraryTopic }) {
  return (
    <section id={topic.id} aria-labelledby={`${topic.id}-title`} className="scroll-mt-28">
      <h2 id={`${topic.id}-title`} className="text-h3 font-medium">
        {topic.label}
      </h2>
      <ul className="mt-4 flex flex-col divide-y divide-[var(--line)]">
        {topic.courses.map((c) => (
          <Row key={c.slug} course={c} />
        ))}
      </ul>
    </section>
  );
}

function Row({ course: c }: { course: LibraryCourse }) {
  const language = languageLabel(c.language);
  return (
    <li className="py-3">
      <Link href={coursePath(c.slug)} className="font-medium text-ink hover:text-moss">
        {c.title}
      </Link>
      <p className="text-[0.88rem] text-ink-soft tabular-nums">
        {c.channel} · {c.lessons} lessons · {formatDuration(c.seconds)}
        {language && ` · ${language}`}
      </p>
    </li>
  );
}
