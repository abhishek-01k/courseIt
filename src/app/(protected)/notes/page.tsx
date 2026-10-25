import type { Metadata } from "next";
import NotesPage from "@/modules/notes/notes-page";

export const metadata: Metadata = { title: "Notes · CourseIt" };

export default function Page() {
  return <NotesPage />;
}
