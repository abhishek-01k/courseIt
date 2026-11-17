import { coursePath } from "@/lib/paths";
import { formatDuration } from "@/lib/utils";
import { SITE_URL } from "../config";
import { courseSummary } from "./metadata";
import { getCourseSeo, isIndexable, type CourseSeo } from "./queries";

function iso(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `PT${Math.floor(minutes / 60)}H${minutes % 60}M`;
}
const LANG: Record<string, string> = { english: "en", hindi: "hi" };

/** schema.org Course, in the shape Google's course structured data reads. Only facts shown on the page. */
export function courseJsonLd(c: CourseSeo) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.title,
    description: courseSummary(c),
    url: `${SITE_URL}${coursePath(c.slug)}`,
    ...(c.thumbnail && { image: c.thumbnail }),
    ...(c.language && LANG[c.language] && { inLanguage: LANG[c.language] }),
    isAccessibleForFree: true,
    timeRequired: iso(c.seconds),
    provider: { "@type": "Organization", name: "CourseIt", url: SITE_URL },
    creator: { "@type": "Organization", name: c.channel, ...(c.channelUrl && { url: c.channelUrl }) },
    offers: [{ "@type": "Offer", category: "Free", price: 0, priceCurrency: "USD" }],
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        courseMode: "Online",
        courseSchedule: { "@type": "Schedule", duration: `PT${c.minutesPerDay}M`, repeatFrequency: "Daily", repeatCount: c.days },
      },
    ],
    syllabusSections: c.lessons.map((l) => ({ "@type": "Syllabus", name: l.title, description: l.summary, timeRequired: iso(l.seconds) })),
  };
}

/** JSON inside <script> must not be able to close the tag: course and lesson titles come from YouTube. */
const safeJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

/**
 * The search-facing part of a public course page: Course structured data, a one-line factual summary, the full lesson
 * outline as plain server-rendered HTML (the lesson list above shows one day at a time and links behind sign-in), and
 * a credit to the creator. Renders nothing for private, failed or unbuilt courses.
 */
export default async function CourseSeo({ slug }: { slug: string }) {
  const c = await getCourseSeo(slug);
  if (!c || !isIndexable(c)) return null;
  return <CourseSeoView c={c} />;
}

export function CourseSeoView({ c }: { c: CourseSeo }) {
  return (
    <section aria-labelledby="about-course" className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:p-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(courseJsonLd(c)) }} />
      <h2 id="about-course" className="text-[1.25rem]">
        About this course
      </h2>
      <p className="text-[0.95rem] text-ink-soft">{courseSummary(c)}</p>
      <p className="text-[0.95rem] text-ink-soft">
        Taught by{" "}
        {c.channelUrl ? (
          <a href={c.channelUrl} target="_blank" rel="noopener" className="font-medium text-ink underline underline-offset-2">
            {c.channel} on YouTube
          </a>
        ) : (
          <span className="font-medium text-ink">{c.channel}</span>
        )}
        . Videos play in YouTube&apos;s own player, so the creator keeps every view.
      </p>
      <details className="group">
        <summary className="cursor-pointer text-[0.95rem] font-medium text-ink">Full course outline ({c.lessons.length} lessons)</summary>
        <ol className="mt-3 flex flex-col gap-3">
          {c.lessons.map((l) => (
            <li key={l.position} className="text-[0.92rem]">
              <h3 className="font-medium text-ink">
                {l.position + 1}. {l.title} <span className="font-normal text-ink-soft tabular-nums">· {formatDuration(l.seconds)}</span>
              </h3>
              <p className="text-ink-soft">{l.summary}</p>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
