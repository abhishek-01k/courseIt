import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

// Nemotron writes math as \( … \) and \[ … \]; remark-math reads $ … $ and $$ … $$.
const toDollars = (md: string) =>
  md.replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `$$${m}$$`).replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => `$${m}$`);

export default function LessonNotes({ markdown }: { markdown: string }) {
  return (
    <div className="flex flex-col gap-3 leading-relaxed text-ink [&_code]:rounded [&_code]:bg-lime-soft/60 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.88em] [&_h2]:mt-4 [&_h2]:text-[1.45rem] [&_h3]:mt-2 [&_h3]:text-[1.15rem] [&_li]:ml-5 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[#0f1611] [&_pre]:p-4 [&_pre]:text-[#f1f3ea] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_ul]:list-disc">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {toDollars(markdown)}
      </ReactMarkdown>
    </div>
  );
}
