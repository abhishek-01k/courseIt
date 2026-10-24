import type { Metadata } from "next";
import TermsPage from "@/modules/legal/terms-page";

export const metadata: Metadata = { title: "Terms and conditions · CourseIt" };

export default function Page() {
  return <TermsPage />;
}
