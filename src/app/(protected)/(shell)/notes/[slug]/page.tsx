import { Suspense } from "react";
import PageSkeleton from "@/components/page-skeleton";
import CourseNotesPage from "@/modules/notes/course-notes-page";

export default function Page({ params }: PageProps<"/notes/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CourseNotesPage params={params} />
    </Suspense>
  );
}
