import type { Metadata } from "next";
import AnnouncementsPage from "@/modules/announcements/announcements-page";

export const metadata: Metadata = { title: "Announcements · Admin · CourseIt", robots: { index: false } };

export default function Page() {
  return <AnnouncementsPage />;
}
