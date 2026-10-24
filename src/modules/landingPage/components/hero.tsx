import Landscape from "@/components/landscape";
import Parallax from "@/components/motion/parallax";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import CtaButtons from "./cta-buttons";
import Pill from "@/components/pill";

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
            {/* NVIDIA mark from Simple Icons (CC0), in NVIDIA green. */}
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-[#76b900]">
              <path d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z" />
            </svg>
            Powered by NVIDIA Nemotron
          </Pill>
        </RevealItem>

        <RevealItem>
          <h1 className="text-h1">
            Turn any YouTube course into one you <em className="italic text-moss">actually finish.</em>
          </h1>
        </RevealItem>

        <RevealItem>
          <p className="max-w-[520px] text-[1.1rem] text-ink-soft">Paste a link. Get lessons, quizzes and a plan that fits your day.</p>
        </RevealItem>

        <RevealItem className="mt-1.5">
          <CtaButtons />
        </RevealItem>

        <RevealItem>
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Free while in beta · No signup to try</span>
        </RevealItem>
      </RevealGroup>
    </section>
  );
}
