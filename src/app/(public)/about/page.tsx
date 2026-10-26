import type { Metadata } from "next";
import AboutPage from "@/modules/about/about-page";

export const metadata: Metadata = { title: "About · CourseIt" };

export default function Page() {
  return <AboutPage />;
}
