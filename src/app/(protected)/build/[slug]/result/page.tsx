import type { Metadata } from "next";
import { Suspense } from "react";
import PageSkeleton from "@/components/page-skeleton";
import ResultPage from "@/modules/placement/result-page";

export const metadata: Metadata = { title: "Placement result · CourseIt" };

export default function Page({ params }: PageProps<"/build/[slug]/result">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResultPage params={params} />
    </Suspense>
  );
}
