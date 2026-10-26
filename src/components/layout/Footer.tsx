import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FOOTER_COLUMNS, SOCIAL_LINKS } from "@/lib/constants";
import { LogoMark } from "./Logo";
import { InstagramIcon, LinkedinIcon, XIcon, YoutubeIcon } from "../icons";

const ICONS = { Instagram: InstagramIcon, YouTube: YoutubeIcon, LinkedIn: LinkedinIcon, X: XIcon };

// Lime band with ink text in both themes (logo rules: ink on lime).
export default function Footer() {
  return (
    <footer className="bg-lime text-[#0f1611]">
      <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-7">
        <div className="grid gap-12 md:grid-cols-[1.4fr_2fr]">
          <div className="flex flex-col items-start">
            <Link href="/" className="flex items-center gap-2 font-display text-[2rem] font-medium leading-none">
              <LogoMark className="h-[40px] w-[52px]" />
              CourseIt
            </Link>
            <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-[#0f1611]/75">
              Paste any YouTube video or playlist and NVIDIA Nemotron turns it into a distraction-free course: bite-sized lessons, a daily plan,
              quizzes that replay the moment you missed, and notes pinned to the video.
            </p>
            <Link
              href="/new"
              className="mt-8 flex w-full max-w-sm items-center justify-center gap-2 bg-[#0f1611] px-6 py-4 font-medium text-lime shadow-[6px_6px_0_0_#4b5e1e] transition-[translate,box-shadow] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_0_#4b5e1e]"
            >
              Build your first course <ArrowRight className="size-4" />
            </Link>
            <div className="mt-8 flex gap-3">
              {SOCIAL_LINKS.map(({ label, href }) => {
                const Icon = ICONS[label];
                return (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex size-11 items-center justify-center bg-[#0f1611]/10 transition-colors hover:bg-[#0f1611] hover:text-lime [&_svg]:size-5"
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="font-mono text-label font-medium tracking-[0.2em] uppercase">{column.title}</h2>
                <ul className="mt-6 flex flex-col gap-4 text-[0.95rem] text-[#0f1611]/75">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-[#0f1611] hover:underline">
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-wrap justify-between gap-3 border-t border-[#0f1611]/20 pt-5 text-sm text-[#0f1611]/75">
          <span>© 2026 CourseIt. Made for people who finish what they start.</span>
          <span>Videos play in YouTube&apos;s own player. Creators keep their views.</span>
        </div>
      </div>
    </footer>
  );
}
