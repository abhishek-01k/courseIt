import { Suspense } from "react";
import Link from "next/link";
import Landscape from "@/components/landscape";
import { Reveal } from "@/components/motion/reveal";
import Pill from "@/components/pill";
import AuthError from "./components/auth-error";
import ProviderButtons from "./components/provider-buttons";
import ProviderButtonsNext from "./components/provider-buttons-next";

export default function LoginPage() {
  return (
    <section className="relative flex h-full items-center justify-center overflow-hidden px-6 pt-20 pb-4">
      <Landscape scene="sunrise" className="dark:hidden" />
      <Landscape scene="night" className="hidden dark:block" />
      <span aria-hidden="true" className="float-square bottom-[24%] left-[8%] max-sm:hidden" />
      <span aria-hidden="true" className="float-square bottom-[18%] left-[calc(8%+52px)] [animation-delay:-3s] max-sm:hidden" />
      <span aria-hidden="true" className="float-square bottom-[28%] right-[9%] [animation-delay:-2s] max-sm:hidden" />

      <Reveal className="glass relative flex max-h-full w-full max-w-[440px] flex-col items-center gap-[18px] rounded-panel px-8 py-10 text-center shadow-blue [@media(max-height:640px)]:gap-3 [@media(max-height:640px)]:py-6">
        <span className="[@media(max-height:640px)]:hidden">
          <Pill>No distraction between your studies</Pill>
        </span>
        <h1 className="text-[clamp(1.8rem,5vh,2.4rem)] leading-[1.08]">
          Pick up where you <em className="italic text-moss">left off.</em>
        </h1>
        <p className="text-[0.95rem] text-ink-soft [@media(max-height:560px)]:hidden">Your streak, your plan and your notes are waiting.</p>
        <Suspense>
          <AuthError />
        </Suspense>
        <Suspense fallback={<ProviderButtons />}>
          <ProviderButtonsNext />
        </Suspense>
        <p className="text-[0.8rem] text-ink-soft">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
            Terms and Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
            Privacy policy
          </Link>
          .
        </p>
      </Reveal>
    </section>
  );
}
