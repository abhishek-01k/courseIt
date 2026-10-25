"use client";

import { ChevronDown, Crown, LogOut, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/modules/dashboard/actions";
import type { UserMenuProps } from "@/types/user-menu";

const item = "min-h-11 gap-3 rounded-xl px-3 text-[0.95rem] text-ink focus:bg-lime-soft focus:text-pill-ink";

export default function UserMenu({ name, image, plan }: UserMenuProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex w-full items-center gap-2.5 rounded-[18px] bg-surface px-3 py-2.5 text-left shadow-[0_0_0_1px_var(--line)] transition-colors outline-none hover:bg-lime-soft/50 focus-visible:ring-2 focus-visible:ring-dusk data-popup-open:bg-lime-soft/50">
        {image ? (
          <Image src={image} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full" />
        ) : (
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime-soft font-display text-[0.9rem] text-pill-ink">
            {initials}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9rem] font-medium">{name}</span>
          <span className="block text-[0.78rem] text-ink-soft">{plan}</span>
        </span>
        <ChevronDown aria-hidden="true" className="size-4.5 shrink-0 text-ink-soft transition-transform duration-200 group-data-popup-open:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" sideOffset={8} className="rounded-[18px] bg-surface p-1.5 shadow-[0_0_0_1px_var(--line),0_24px_48px_-20px_rgba(22,49,92,0.4)] ring-0">
        <DropdownMenuItem render={<Link href="/settings" />} className={item}>
          <Settings className="size-[18px]" />
          Settings
        </DropdownMenuItem>
        {/* ponytail: no Pricing page yet; enable when it ships. */}
        <DropdownMenuItem disabled className={item}>
          <Crown className="size-[18px]" />
          Pricing
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem
          checked={dark}
          onCheckedChange={(on) => setTheme(on ? "dark" : "light")}
          className={cn(item, "pr-3 [&_[data-slot=dropdown-menu-checkbox-item-indicator]]:hidden")}
        >
          <span aria-hidden="true" className={cn("relative h-5 w-[34px] shrink-0 rounded-full transition-colors", dark ? "bg-moss" : "bg-ink/15")}>
            <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-[left]", dark ? "left-4" : "left-0.5")} />
          </span>
          Dark mode
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator className="mx-1 my-1.5 bg-line" />
        <DropdownMenuItem className={item} onClick={() => signOutAction()}>
          <LogOut className="size-[18px]" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
