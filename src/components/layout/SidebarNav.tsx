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

type NavListProps = { group: keyof typeof GROUPS; className?: string; pathname?: string; counts?: Record<string, number> };

// No highlight until the URL is known (the Suspense fallback), then the active link lights up.
// Counts (by href) show once the server has them; the collapsed rail shows icons only.
export function NavList({ group, className, pathname, counts }: NavListProps) {
  return (
    <nav aria-label={group === "Explore" ? "Explore" : "Main"} className={cn("flex flex-col gap-0.5", className)}>
      {GROUPS[group].map(({ title, href, icon: Icon }) => {
        const active = pathname === href || Boolean(pathname?.startsWith(`${href}/`));
        const count = counts?.[href];
        const alert = href === "/inbox" && !!count; // unread messages stand out; other counts are just totals
        return (
          <Link
            key={href}
            href={href}
            title={title}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-colors hover:bg-lime-soft/60 group-data-[collapsed=true]/side:justify-center group-data-[collapsed=true]/side:px-0",
              active ? "bg-lime-soft font-medium text-pill-ink" : "text-ink-soft",
            )}
          >
            <span className="relative shrink-0">
              <Icon aria-hidden="true" className="size-[18px]" />
              {alert && <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 hidden size-2 rounded-full bg-moss group-data-[collapsed=true]/side:block" />}
            </span>
            <span className="flex-1 group-data-[collapsed=true]/side:sr-only">{title}</span>
            {count ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[0.72rem] tabular-nums group-data-[collapsed=true]/side:hidden",
                  alert ? "bg-moss text-on-moss" : "bg-surface text-ink-soft shadow-[inset_0_0_0_1px_var(--line)]",
                )}
              >
                {count}
                <span className="sr-only"> {alert ? "unread" : title.toLowerCase()}</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export default function SidebarNav(props: Omit<NavListProps, "pathname">) {
  return <NavList {...props} pathname={usePathname()} />;
}
