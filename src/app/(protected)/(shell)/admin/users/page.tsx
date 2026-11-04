import type { Metadata } from "next";
import AdminUsersPage from "@/modules/admin/users-page";

export const metadata: Metadata = { title: "Learners · Admin · CourseIt", robots: { index: false } };

export default function Page({ searchParams }: PageProps<"/admin/users">) {
  return <AdminUsersPage searchParams={searchParams} />;
}
