import type { Metadata } from "next";
import { Suspense } from "react";
import PageSkeleton from "@/components/page-skeleton";
import OnboardingPage from "@/modules/onboarding/onboarding-page";

export const metadata: Metadata = { title: "Building your course · CourseIt" };

export default function Page({ params }: PageProps<"/build/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OnboardingPage params={params} />
    </Suspense>
  );
}
