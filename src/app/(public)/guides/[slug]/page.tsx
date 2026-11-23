import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuidePage from "../../../../../seo/guides/guide-page";
import { GUIDES, getGuide } from "../../../../../seo/guides/guides";

// Guides live in seo/content/guides (SEO lane). This file only routes /guides/<slug>.
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const g = getGuide((await params).slug);
  if (!g) return {};
  const url = `https://www.courseit.xyz/guides/${g.slug}`;
  return { title: `${g.title} · CourseIt`, description: g.description, alternates: { canonical: url }, openGraph: { title: g.title, description: g.description, type: "article", url } };
}

export default async function Page({ params }: PageProps<"/guides/[slug]">) {
  const g = getGuide((await params).slug);
  if (!g) notFound();
  return <GuidePage guide={g} />;
}
