"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_EXPLORE_LINKS, APP_NAV_LINKS } from "@/lib/constants";

// Icons are components, which can't cross from the server sidebar, so links are looked up here by group.
const GROUPS = {
  Main: APP_NAV_LINKS,
  Explore: APP_EXPLORE_LINKS,
  All: [...APP_NAV_LINKS, ...APP_EXPLORE_LINKS],
};

type NavListProps = { group: keyof typeof GROUPS; className?: string; pathname?: string };

// No highlight until the URL is known (the Suspense fallback), then the active link lights up.
export function NavList({ group, className, pathname }: NavListProps) {
  return (
    <nav aria-label={group === "Explore" ? "Explore" : "Main"} className={cn("flex flex-col gap-0.5", className)}>
      {GROUPS[group].map(({ title, href, icon: Icon }) => {
        const active = pathname === href || Boolean(pathname?.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-colors hover:bg-lime-soft/60",
              active ? "bg-lime-soft font-medium text-pill-ink" : "text-ink-soft",
            )}
          >
            <Icon aria-hidden="true" className="size-[18px]" />
            {title}
          </Link>
        );
      })}
    </nav>
  );
}

export default function SidebarNav(props: Omit<NavListProps, "pathname">) {
  return <NavList {...props} pathname={usePathname()} />;
}
