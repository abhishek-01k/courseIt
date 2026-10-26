import Link from "next/link";
import { LEGAL_LINKS, NAV_LINKS } from "@/lib/constants";
import { LogoMark } from "./Logo";
import { InstagramIcon, LinkedinIcon, YoutubeIcon } from "../icons";
import { Button } from "../ui/button";

const SOCIAL_ICONS = [
  {
    label: "Instagram",
    icon: <InstagramIcon />,
  },
  {
    label: "YouTube",
    icon: <YoutubeIcon />,
  },
  {
    label: "LinkedIn",
    icon: <LinkedinIcon />,
  },
];

// Lime band with ink text in both themes (logo rules: ink on lime).
export default function Footer() {
  return (
    <footer className="bg-lime text-[#0f1611]">
      <div className="mx-auto max-w-[1200px] px-6 pt-14 pb-7">
        <div className="flex flex-wrap items-center justify-between gap-7">
          <div className="flex flex-col items-start sm:col-span-2 md:col-span-1">
            <div className="flex gap-2 items-center font-display text-[2.15rem] font-medium leading-none">
              <LogoMark className="h-[45px] w-[58px]" />
              <span className="group-data-[collapsed=true]/side:sr-only ">
                CourseIt
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Paste any YouTube video or playlist and NVIDIA Nemotron turns it
              into a distraction-free course: bite-sized lessons, a daily plan,
              quizzes that replay the moment you missed, and notes pinned to the
              video.
            </p>
            <div className="mt-8 flex gap-3" aria-label="Social media">
              {SOCIAL_ICONS.map(({ label, icon }) => (
                <Button
                  key={label}
                  className="flex size-10 items-center justify-center bg-pink/50 text-pink-headline"
                  role="img"
                  aria-label={label}
                >
                  <span className="size-5">{icon}</span>
                </Button>
              ))}
            </div>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-6 text-[0.95rem]"
          >
            {[...NAV_LINKS, ...LEGAL_LINKS].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:underline"
              >
                {link.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-[#0f1611]/20 pt-5 text-sm">
          <span>© 2026 CourseIt</span>
          <span>
            Videos play in YouTube&apos;s own player. Creators keep their views.
          </span>
        </div>
      </div>
    </footer>
  );
}
