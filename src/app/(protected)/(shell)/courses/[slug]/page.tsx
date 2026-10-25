import { Suspense } from "react";
import PageSkeleton from "@/components/page-skeleton";
import CoursePage from "@/modules/course/course-page";

export default function Page({ params }: PageProps<"/courses/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CoursePage params={params} />
    </Suspense>
  );
}
