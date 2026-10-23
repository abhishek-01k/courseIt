import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-xs space-y-3">
            <Logo />
            <p className="text-sm text-muted-foreground">Turn any YouTube course into one you actually finish.</p>
          </div>
          <nav aria-label="Footer" className="flex gap-7 text-sm text-muted-foreground">
            {NAV_LINKS.map((link) => (
              <Link key={link.id} href={link.href} className="transition-colors hover:text-foreground">
                {link.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t pt-6 text-sm text-muted-foreground">
          <span>© 2026 CourseIt</span>
          <span>Videos play in YouTube&apos;s own player. Creators keep their views.</span>
        </div>
      </div>
    </footer>
  );
}
