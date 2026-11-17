import type { Metadata } from "next";
import { coursePath } from "@/lib/paths";
import { formatDuration, plural } from "@/lib/utils";
import { SITE_URL } from "../config";
import { getCourseSeo, isIndexable, type CourseSeo } from "./queries";

/** One factual sentence a searcher can act on, built only from the course's own data. Also used on the page. */
export function courseSummary(c: CourseSeo) {
  const what = c.quizQuestions > 0 ? "study notes and a quiz" : "study notes";
  return [
    `A free ${c.lessons.length}-lesson course built from ${c.channel}'s ${formatDuration(c.seconds)} of YouTube${c.sourceType === "playlist" ? " playlist" : " video"}.`,
    `${plural(c.days, "day")} at ${c.minutesPerDay} minutes a day, with ${what} in every lesson.`,
    c.placementTest ? "A 2-minute placement test skips what you already know." : "",
  ]
    .join(" ")
    .trim();
}

/**
 * Title, description, canonical and robots for /courses/<slug>.
 * Titles lead with the course's own name (what people search) and add what CourseIt gives on top of the video.
 */
export async function courseMetadata(slug: string): Promise<Metadata> {
  const c = await getCourseSeo(slug);
  // Private, missing, failed or still building: never indexed. Private and missing courses 404 anyway.
  if (!c) return { robots: { index: false } };
  if (!isIndexable(c)) return { title: `${c.title} · CourseIt`, robots: { index: false, follow: true } };
  const extras = c.quizQuestions > 0 ? "notes & quizzes" : "notes";
  const title = `${c.title}: free course with ${extras} · CourseIt`;
  const description = courseSummary(c);
  const url = `${SITE_URL}${coursePath(c.slug)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "website", url, siteName: "CourseIt" },
    twitter: { card: "summary_large_image", title, description },
  };
}
