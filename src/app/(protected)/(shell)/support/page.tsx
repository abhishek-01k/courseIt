import type { Metadata } from "next";
import SupportPage from "@/modules/support/support-page";

export const metadata: Metadata = { title: "Support · CourseIt" };

export default function Page() {
  return <SupportPage />;
}
