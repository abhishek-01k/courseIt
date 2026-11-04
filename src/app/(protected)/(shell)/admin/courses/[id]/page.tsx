import type { Metadata } from "next";
import AdminCoursePage from "@/modules/admin/course-page";

export const metadata: Metadata = { title: "Course · Admin · CourseIt", robots: { index: false } };

export default function Page({ params }: PageProps<"/admin/courses/[id]">) {
  return <AdminCoursePage params={params} />;
}
