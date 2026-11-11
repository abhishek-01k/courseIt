import type { Metadata } from "next";
import type { SearchParams } from "@/modules/admin/components/ui";
import AdminStatsPage from "@/modules/admin/stats-page";

export const metadata: Metadata = { title: "Stats · Admin · CourseIt", robots: { index: false } };

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return <AdminStatsPage searchParams={searchParams} />;
}
