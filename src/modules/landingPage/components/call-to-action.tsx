import Landscape from "@/components/landscape";
import { Reveal } from "@/components/motion/reveal";
import CtaButtons from "./cta-buttons";
import Pill from "./pill";

export default function CallToAction() {
  return (
    <section aria-labelledby="cta-title" className="px-6 pt-5 pb-[110px]">
      <div className="relative mx-auto h-[620px] max-w-[1200px] overflow-hidden rounded-panel shadow-blue">
        <Landscape scene="dusk" className="dark:hidden" />
        <Landscape scene="night" className="hidden dark:block" />
        <span aria-hidden="true" className="float-square top-16 left-[7%]" />
        <span aria-hidden="true" className="float-square top-16 left-[calc(7%+52px)] [animation-delay:-3s]" />
        <span aria-hidden="true" className="float-square top-[110px] right-[8%] [animation-delay:-2s]" />

        <div className="absolute inset-0 flex items-center justify-center p-6">
          <Reveal className="glass flex w-full max-w-[640px] flex-col items-center gap-4 rounded-panel px-8 py-12 text-center">
            <Pill>Start today</Pill>
            <h2 id="cta-title" className="text-h2">
              Your next course starts <em className="italic text-moss">today.</em>
            </h2>
            <p className="text-ink-soft">Paste a link and get a plan in under a minute.</p>
            <div className="mt-1.5">
              <CtaButtons />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
