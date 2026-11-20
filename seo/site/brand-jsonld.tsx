import { LEGAL, SOCIAL_LINKS } from "@/lib/constants";
import { SITE_URL } from "../config";

// Organization + WebSite structured data for the home page: tells Google (and AI answers) what "CourseIt" is, which
// profiles are its own, and which spellings mean the same site. Search Console shows people typing "coursit",
// "course it xyz" and "courseit.xy" (13–15 Nov 2026); alternateName covers the spellings that are really our name.
// Only CourseIt's own profiles go in sameAs: the maker's personal X and Instagram are not the organization.
const ORG_PROFILES = [SOCIAL_LINKS.find((l) => l.label === "LinkedIn")?.href, "https://github.com/abhishek-01k/courseIt"].filter(Boolean);

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "CourseIt",
      alternateName: ["Course It", "courseit.xyz"],
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo-512.png`, width: 512, height: 512 },
      description: "CourseIt turns any YouTube video or playlist into a structured course: lessons, study notes, quizzes, a placement test and a daily plan.",
      founder: { "@type": "Person", name: "Abhishek Kumar" },
      parentOrganization: { "@type": "Organization", name: LEGAL.parent.name, url: LEGAL.parent.url },
      sameAs: ORG_PROFILES,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "CourseIt",
      alternateName: ["Course It", "courseit.xyz"],
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
  ],
};

/** Rendered once, on the home page only (where Google reads site-name and organization data). */
export default function BrandJsonLd() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} />;
}
