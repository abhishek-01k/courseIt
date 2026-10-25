import type { Metadata } from "next";
import CoursesPage from "@/modules/courses/courses-page";

export const metadata: Metadata = { title: "My courses · CourseIt" };

export default function Page() {
  return <CoursesPage />;
}
