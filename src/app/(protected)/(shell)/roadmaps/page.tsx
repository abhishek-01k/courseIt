import type { Metadata } from "next";
import MyRoadmapsPage from "@/modules/roadmap/my-roadmaps-page";

export const metadata: Metadata = { title: "Roadmaps · CourseIt" };

export default function Page() {
  return <MyRoadmapsPage />;
}
