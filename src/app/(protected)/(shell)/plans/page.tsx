import type { Metadata } from "next";
import PlansPage from "@/modules/pricing/plans-page";

export const metadata: Metadata = { title: "Plans · CourseIt" };

export default function Page({ searchParams }: PageProps<"/plans">) {
  return <PlansPage searchParams={searchParams} />;
}
