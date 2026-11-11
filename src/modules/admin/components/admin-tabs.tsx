"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", title: "Overview" },
  { href: "/admin/stats", title: "Stats" },
  { href: "/admin/users", title: "Learners" },
  { href: "/admin/courses", title: "Courses" },
  { href: "/admin/roadmaps", title: "Roadmaps" },
  { href: "/admin/announcements", title: "Announcements" },
];

// Overview matches /admin only; the others also light up on their detail pages.
export default function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {TABS.map(({ href, title }) => {
        const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 shrink-0 items-center rounded-full px-4 text-[0.92rem] transition-colors hover:bg-lime-soft/60",
              active ? "bg-lime-soft font-medium text-pill-ink" : "text-ink-soft",
            )}
          >
            {title}
          </Link>
        );
      })}
    </nav>
  );
}
