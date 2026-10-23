import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";
import Logo from "./Logo";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Logo />

        <nav aria-label="Main" className="hidden gap-7 text-sm text-muted-foreground sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.id} href={link.href} className="transition-colors hover:text-foreground">
              {link.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "lg" })}>
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
