import type { Metadata } from "next";
import CommunityPage from "@/modules/community/community-page";

export const metadata: Metadata = { title: "Community · CourseIt" };

export default function Page({ searchParams }: PageProps<"/community">) {
  return <CommunityPage searchParams={searchParams} />;
}
