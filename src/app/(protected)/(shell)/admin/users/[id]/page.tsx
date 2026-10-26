import type { Metadata } from "next";
import AdminUserPage from "@/modules/admin/user-page";

export const metadata: Metadata = { title: "Learner · Admin · CourseIt", robots: { index: false } };

export default function Page({ params }: PageProps<"/admin/users/[id]">) {
  return <AdminUserPage params={params} />;
}
