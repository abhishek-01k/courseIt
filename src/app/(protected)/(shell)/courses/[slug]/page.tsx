import type { Metadata } from "next";
import { Suspense } from "react";
import PageSkeleton from "@/components/page-skeleton";
import CoursePage from "@/modules/course/course-page";
import { courseMetadata } from "../../../../../../seo/course/metadata";

// Title, description, canonical and robots come from the SEO lane (seo/course/metadata.ts).
export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  return courseMetadata((await params).slug);
}

export default function Page({ params }: PageProps<"/courses/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CoursePage params={params} />
    </Suspense>
  );
}
