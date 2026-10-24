import Link from "next/link";
import { LEGAL_LINKS, NAV_LINKS } from "@/lib/constants";
import { LogoMark } from "./Logo";

// Lime band with ink text in both themes (logo rules: ink on lime).
export default function Footer() {
  return (
    <footer className="bg-lime text-[#0f1611]">
      <div className="mx-auto max-w-[1200px] px-6 pt-14 pb-7">
        <div className="flex flex-wrap items-center justify-between gap-7">
          <Link href="/" aria-label="CourseIt home">
            <LogoMark className="h-[45px] w-[58px]" />
          </Link>
          <nav aria-label="Footer" className="flex flex-wrap gap-6 text-[0.95rem]">
            {[...NAV_LINKS, ...LEGAL_LINKS].map((link) => (
              <Link key={link.href} href={link.href} className="hover:underline">
                {link.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-[#0f1611]/20 pt-5 text-sm">
          <span>© 2026 CourseIt</span>
          <span>Videos play in YouTube&apos;s own player. Creators keep their views.</span>
        </div>
      </div>
    </footer>
  );
}
