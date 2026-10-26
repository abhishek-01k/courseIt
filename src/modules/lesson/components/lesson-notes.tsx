import "katex/dist/katex.min.css";
import { ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { Reading } from "@/lib/tavily";

// Nemotron writes math as \( … \) and \[ … \]; remark-math reads $ … $ and $$ … $$.
const toDollars = (md: string) =>
  md.replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `$$${m}$$`).replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => `$${m}$`);

export default function LessonNotes({ markdown, reading = [] }: { markdown: string; reading?: Reading[] }) {
  return (
    <>
    <div className="flex flex-col gap-3 leading-relaxed text-ink [&_code]:rounded [&_code]:bg-lime-soft/60 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.88em] [&_h2]:mt-4 [&_h2]:text-[1.45rem] [&_h3]:mt-2 [&_h3]:text-[1.15rem] [&_li]:ml-5 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[#0f1611] [&_pre]:p-4 [&_pre]:text-[#f1f3ea] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_ul]:list-disc">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {toDollars(markdown)}
      </ReactMarkdown>
    </div>
    {reading.length > 0 && (
      <section aria-labelledby="reading-title" className="mt-8 flex flex-col gap-2.5 border-t pt-5">
        <h2 id="reading-title" className="text-[1.15rem] font-medium">
          Further reading
        </h2>
        <ul className="flex flex-col gap-1.5">
          {reading.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer noopener" className="group inline-flex items-start gap-2 text-moss hover:underline">
                <ExternalLink aria-hidden="true" className="mt-1 size-4 shrink-0" />
                <span>
                  {r.title} <span className="text-[0.85rem] text-ink-soft">· {new URL(r.url).hostname.replace(/^www\./, "")}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="text-[0.8rem] text-ink-soft">Found on the web by Tavily while this lesson was written.</p>
      </section>
    )}
    </>
  );
}
