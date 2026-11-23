import type { Metadata } from "next";
import GuidesIndex from "../../../../seo/guides/guides-index";

// The page lives in seo/guides (SEO lane). This file only puts it at /guides.
export const metadata: Metadata = {
  title: "Guides: learning from YouTube · CourseIt",
  description: "Practical guides for self-learners who study from YouTube videos and playlists.",
  alternates: { canonical: "https://www.courseit.xyz/guides" },
};

export default function Page() {
  return <GuidesIndex />;
}
