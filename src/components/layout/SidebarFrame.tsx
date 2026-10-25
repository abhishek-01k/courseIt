"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const KEY = "courseit:sidebar-collapsed";
const listeners = new Set<() => void>();

// The choice is a per-browser convenience, so it lives in localStorage (and may be unavailable).
function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
function write(collapsed: boolean) {
  try {
    localStorage.setItem(KEY, collapsed ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/**
 * The desktop sidebar's frame: full width (248px) or an icon rail (76px). Children style their own
 * collapsed look with `group-data-[collapsed=true]/side:…`.
 */
export default function SidebarFrame({ logo, children }: { logo: React.ReactNode; children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <aside
      aria-label="App"
      data-collapsed={collapsed}
      className={cn(
        "group/side sticky top-0 hidden h-dvh shrink-0 flex-col gap-[18px] border-r bg-sidebar py-[18px] transition-[width] duration-200 motion-reduce:transition-none lg:flex",
        collapsed ? "w-[76px] px-2.5" : "w-[248px] px-3.5",
      )}
    >
      <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between pl-1.5")}>
        {logo}
        <button
          type="button"
          onClick={() => write(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-lime-soft/60 hover:text-ink focus-visible:ring-2 focus-visible:ring-dusk focus-visible:outline-none"
        >
          <Icon aria-hidden="true" className="size-[18px]" />
        </button>
      </div>
      {children}
    </aside>
  );
}
