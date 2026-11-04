import type { Metadata } from "next";
import RefundsPage from "@/modules/legal/refunds-page";

export const metadata: Metadata = { title: "Refund and cancellation policy · CourseIt" };

export default function Page() {
  return <RefundsPage />;
}
