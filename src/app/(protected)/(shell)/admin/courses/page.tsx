import type { Metadata } from "next";
import AdminCoursesPage from "@/modules/admin/courses-page";

export const metadata: Metadata = { title: "Courses · Admin · CourseIt", robots: { index: false } };

export default function Page({ searchParams }: PageProps<"/admin/courses">) {
  return <AdminCoursesPage searchParams={searchParams} />;
}
