import Pill from "@/components/pill";
import { LEGAL } from "@/lib/constants";

type LegalDocumentProps = {
  title: string;
  accent: string;
  intro: string;
  children: React.ReactNode;
};

// Shared layout for /privacy and /terms: one readable column, headings in Display, body in ink-soft.
export default function LegalDocument({ title, accent, intro, children }: LegalDocumentProps) {
  return (
    <article className="mx-auto w-full max-w-[760px] px-6 pt-36 pb-[110px]">
      <Pill>Last updated {LEGAL.lastUpdated}</Pill>
      <h1 className="mt-5 text-h1">
        {title} <em className="italic text-moss">{accent}</em>
      </h1>
      <p className="mt-5 text-[1.05rem] text-ink-soft">{intro}</p>
      <div className="mt-12 flex flex-col gap-10">{children}</div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 text-ink-soft [&_a]:text-moss [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-ink">
      <h2 className="text-h3 font-medium text-ink">{title}</h2>
      {children}
    </section>
  );
}
