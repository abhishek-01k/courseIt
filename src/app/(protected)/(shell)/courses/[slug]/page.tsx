import type { Metadata } from "next";
import { Suspense } from "react";
import PageSkeleton from "@/components/page-skeleton";
import { formatDuration, plural } from "@/lib/utils";
import CoursePage from "@/modules/course/course-page";
import { getCoursePreview } from "@/modules/course/queries";

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const c = await getCoursePreview((await params).slug);
  if (!c) return {};
  const title = `${c.title} · CourseIt`;
  const description = [
    `${c.channel}'s ${formatDuration(c.seconds)} of YouTube as ${plural(c.lessons, "lesson")} over ${plural(c.days, "day")} at ${c.minutesPerDay} min a day.`,
    c.quizzes ? "Notes and a quiz in every lesson." : "Notes for every lesson.",
    c.placementTest ? "A 2-minute placement test skips what you already know." : "",
  ].join(" ").trim();
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function Page({ params }: PageProps<"/courses/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CoursePage params={params} />
    </Suspense>
  );
}
