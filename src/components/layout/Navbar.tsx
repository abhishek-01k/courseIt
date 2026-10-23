import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";
import Logo from "./Logo";

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-[18px] z-50 flex justify-center px-4">
      <div className="flex w-full max-w-[880px] items-center gap-3 rounded-full bg-paper/80 py-1.5 pr-1.5 pl-4 shadow-[0_0_0_1px_var(--line),0_20px_40px_-24px_rgba(22,49,92,0.35)] backdrop-blur-[14px]">
        <Logo />

        <nav aria-label="Main" className="ml-auto hidden gap-6 text-[0.92rem] text-ink-soft md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.id} href={link.href} className="transition-colors hover:text-ink">
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-3">
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Start learning
          </Link>
        </div>
      </div>
    </header>
  );
}
