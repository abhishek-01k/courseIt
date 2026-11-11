import type { Metadata } from "next";
import AnnouncementsPage from "@/modules/announcements/announcements-page";

export const metadata: Metadata = { title: "Announcements · Admin · CourseIt", robots: { index: false } };

export default function Page({ searchParams }: PageProps<"/admin/announcements">) {
  return <AnnouncementsPage searchParams={searchParams} />;
}
