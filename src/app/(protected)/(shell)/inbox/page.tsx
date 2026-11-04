import type { Metadata } from "next";
import InboxPage from "@/modules/inbox/inbox-page";

export const metadata: Metadata = { title: "Inbox · CourseIt" };

export default function Page() {
  return <InboxPage />;
}
