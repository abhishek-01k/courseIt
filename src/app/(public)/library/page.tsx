import type { Metadata } from "next";
import LibraryPage from "../../../../seo/library/library-page";

// The page lives in seo/library (SEO lane). This file only puts it at /library.
export const metadata: Metadata = {
  title: "Free YouTube courses with notes and quizzes · CourseIt library",
  description: "Every free course on CourseIt by topic: YouTube videos and playlists turned into lessons with study notes, quizzes and a daily plan.",
  alternates: { canonical: "https://www.courseit.xyz/library" },
};

export default function Page() {
  return <LibraryPage />;
}
