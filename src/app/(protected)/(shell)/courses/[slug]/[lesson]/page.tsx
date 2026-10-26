import { Suspense } from "react";
import PageSkeleton from "@/components/page-skeleton";
import LessonPage from "@/modules/lesson/lesson-page";

export default function Page({ params, searchParams }: PageProps<"/courses/[slug]/[lesson]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LessonPage params={params} searchParams={searchParams} />
    </Suspense>
  );
}
