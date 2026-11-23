import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Pill from "@/components/pill";
import { SITE_URL } from "../config";
import type { Guide } from "./guides";

const formatDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

/** Article structured data: matches what's visible (headline, description, updated date, publisher). */
function articleJsonLd(g: Guide) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.description,
    dateModified: g.updated,
    datePublished: g.updated,
    mainEntityOfPage: `${SITE_URL}/guides/${g.slug}`,
    author: { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export default function GuidePage({ guide: g }: { guide: Guide }) {
  return (
    <article className="mx-auto w-full max-w-[760px] px-6 pt-36 pb-[110px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(g)).replace(/</g, "\\u003c") }} />
      <Link href="/guides" className="text-[0.9rem] text-ink-soft hover:text-ink">
        ← Guides
      </Link>
      <h1 className="mt-4 text-h1">{g.title}</h1>
      <div className="mt-5">
        <Pill>Updated {formatDate(g.updated)}</Pill>
      </div>
      {/* Answer first: the one paragraph AI answers and snippets quote. */}
      <p className="mt-6 rounded-card bg-lime-soft px-5 py-4 text-[1.05rem] text-pill-ink">{g.answer}</p>
      <div className="mt-10 flex flex-col gap-4 text-[1.02rem] text-ink-soft [&_a]:text-moss [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-6 [&_h2]:text-h3 [&_h2]:font-medium [&_h2]:text-ink [&_strong]:font-medium [&_strong]:text-ink">
        <ReactMarkdown>{g.body}</ReactMarkdown>
      </div>
    </article>
  );
}
