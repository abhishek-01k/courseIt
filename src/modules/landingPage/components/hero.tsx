import Landscape from "@/components/landscape";
import Parallax from "@/components/motion/parallax";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import CtaButtons from "./cta-buttons";
import Pill from "@/components/pill";
import { NvidiaIcon } from "@/components/icons";
import { LEGAL } from "@/lib/constants";

export default function Hero() {
  return (
    <section aria-label="Intro" className="relative h-[980px] overflow-hidden">
      <Parallax className="absolute inset-0">
        <Landscape scene="sunrise" className="dark:hidden" />
        <Landscape scene="night" className="hidden dark:block" />
      </Parallax>

      <span aria-hidden="true" className="float-square top-[700px] left-[5%]" />
      <span aria-hidden="true" className="float-square top-[700px] left-[calc(5%+52px)] [animation-delay:-2s]" />
      <span aria-hidden="true" className="float-square top-[752px] left-[calc(5%+52px)] [animation-delay:-4s]" />
      <span aria-hidden="true" className="float-square top-[640px] right-[6%] [animation-delay:-1s]" />
      <span aria-hidden="true" className="float-square top-[692px] right-[6%] [animation-delay:-3s]" />

      <RevealGroup stagger={0.12} className="relative z-10 mx-auto flex max-w-[980px] flex-col items-center gap-[22px] px-6 pt-[178px] text-center">
        <RevealItem>
          <Pill>
           <NvidiaIcon/>
            Powered by NVIDIA Nemotron
          </Pill>
        </RevealItem>

        <RevealItem>
          <h1 className="text-h1">
            Turn any YouTube video into a course you <em className="italic text-moss">actually finish.</em>
          </h1>
        </RevealItem>

        <RevealItem>
          <p className="max-w-[560px] text-[1.1rem] text-ink-soft">Paste a link. Get lessons, quizzes and a plan that fits your day.</p>
        </RevealItem>

        <RevealItem className="mt-1.5">
          <CtaButtons />
        </RevealItem>

        <RevealItem>
          <p className="font-mono text-label tracking-[0.2em] text-ink-soft uppercase">
            A{" "}
            <a
              href={LEGAL.parent.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-ink underline underline-offset-4 hover:text-moss"
            >
              {LEGAL.operator}
            </a>{" "}
            product
          </p>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
