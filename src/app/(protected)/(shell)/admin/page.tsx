import type { Metadata } from "next";
import AdminPage from "@/modules/admin/admin-page";

export const metadata: Metadata = { title: "Admin · CourseIt", robots: { index: false } };

export default function Page({ searchParams }: PageProps<"/admin">) {
  return <AdminPage searchParams={searchParams} />;
}
