import { Suspense } from "react";
import PageSkeleton from "@/components/page-skeleton";
import RoadmapPage from "@/modules/roadmap/roadmap-page";

export default function Page({ params }: PageProps<"/roadmaps/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RoadmapPage params={params} />
    </Suspense>
  );
}
