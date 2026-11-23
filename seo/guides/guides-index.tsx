import Link from "next/link";
import Pill from "@/components/pill";
import { GUIDES } from "./guides";

/** /guides: every guide, newest update first. */
export default function GuidesIndex() {
  const guides = [...GUIDES].sort((a, b) => b.updated.localeCompare(a.updated));
  return (
    <article className="mx-auto w-full max-w-[760px] px-6 pt-36 pb-[110px]">
      <Pill>Guides</Pill>
      <h1 className="mt-4 text-h1">
        Learn from YouTube, <em className="italic text-moss">and finish.</em>
      </h1>
      <p className="mt-5 text-[1.05rem] text-ink-soft">Practical guides for self-learners who study from YouTube videos and playlists.</p>
      <ul className="mt-10 flex flex-col divide-y divide-[var(--line)]">
        {guides.map((g) => (
          <li key={g.slug} className="py-4">
            <Link href={`/guides/${g.slug}`} className="text-[1.15rem] font-medium text-ink hover:text-moss">
              {g.title}
            </Link>
            <p className="mt-1 text-[0.95rem] text-ink-soft">{g.description}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
