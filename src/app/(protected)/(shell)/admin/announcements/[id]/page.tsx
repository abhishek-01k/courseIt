import type { Metadata } from "next";
import AnnouncementPage from "@/modules/announcements/announcement-page";

export const metadata: Metadata = { title: "Announcement · Admin · CourseIt", robots: { index: false } };

export default function Page({ params }: PageProps<"/admin/announcements/[id]">) {
  return <AnnouncementPage params={params} />;
}
