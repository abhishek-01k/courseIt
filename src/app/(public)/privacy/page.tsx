import type { Metadata } from "next";
import PrivacyPage from "@/modules/legal/privacy-page";

export const metadata: Metadata = { title: "Privacy policy · CourseIt" };

export default function Page() {
  return <PrivacyPage />;
}
