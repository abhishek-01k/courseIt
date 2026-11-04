import type { Metadata } from "next";
import AdminRoadmapsPage from "@/modules/admin/roadmaps-page";

export const metadata: Metadata = { title: "Roadmaps · Admin · CourseIt", robots: { index: false } };

export default function Page({ searchParams }: PageProps<"/admin/roadmaps">) {
  return <AdminRoadmapsPage searchParams={searchParams} />;
}
