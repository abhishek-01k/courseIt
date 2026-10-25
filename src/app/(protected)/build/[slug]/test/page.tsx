import type { Metadata } from "next";
import { Suspense } from "react";
import PageSkeleton from "@/components/page-skeleton";
import TestPage from "@/modules/placement/test-page";

export const metadata: Metadata = { title: "Placement test · CourseIt" };

export default function Page({ params }: PageProps<"/build/[slug]/test">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TestPage params={params} />
    </Suspense>
  );
}
