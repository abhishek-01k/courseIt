import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import Thumbnail from "@/components/thumbnail";
import { cn, initials } from "@/lib/utils";

// Small building blocks shared by the admin pages.

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export type Params = Record<string, string | undefined>;

/** A single string from searchParams, trimmed and capped. */
export const param = (sp: Record<string, string | string[] | undefined>, key: string) => {
  const v = sp[key];
  return (typeof v === "string" ? v : "").trim().slice(0, 80);
};
export const pageParam = (sp: Record<string, string | string[] | undefined>) => Math.max(0, (Number.parseInt(param(sp, "page"), 10) || 1) - 1);

/** Builds an /admin URL from params, dropping empty ones so links stay tidy. */
export function href(path: string, params: Params) {
  const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1]))).toString();
  return qs ? `${path}?${qs}` : path;
}

export const n = (v: number) => v.toLocaleString("en");
export const pct = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v * 100)}%`);
/** 5400 → "1.5h", 600 → "10m". */
export function hours(seconds: number) {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = seconds / 3600;
  return `${h < 10 ? h.toFixed(1) : n(Math.round(h))}h`;
}

const TONE = { ready: "ok", failed: "err" } as const;
/** Badge tone for a course status: ready is green, failed red, anything still building amber. */
export const statusTone = (s: string) => TONE[s as keyof typeof TONE] ?? "warn";

export const card = "flex flex-col gap-3 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)]";
export const row = "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] bg-paper p-2 pr-3 hover:bg-lime-soft/40";

export function Section({ title, count, children, className }: { title: string; count?: number; children: React.ReactNode; className?: string }) {
  const id = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`;
  return (
    <section aria-labelledby={id} className={cn(card, className)}>
      <h2 id={id} className="text-h3 font-medium">
        {title} {count != null && <span className="text-ink-soft tabular-nums">{n(count)}</span>}
      </h2>
      {children}
    </section>
  );
}

export type Tile = { label: string; value: string | number; note?: string };

export function Tiles({ tiles }: { tiles: Tile[] }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] gap-3">
      {tiles.map((t) => (
        <li key={t.label} className="flex flex-col gap-1 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)]">
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">{t.label}</span>
          <span className="font-display text-[clamp(1.9rem,3.4vw,2.5rem)] leading-none tabular-nums">{typeof t.value === "number" ? n(t.value) : t.value}</span>
          {t.note && <span className="text-[0.85rem] text-ink-soft tabular-nums">{t.note}</span>}
        </li>
      ))}
    </ul>
  );
}

export function Avatar({ name, image, size = 36 }: { name: string | null; image: string | null; size?: number }) {
  return (
    <Thumbnail
      src={image}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className="shrink-0 rounded-full"
      style={{ width: size, height: size }}
      fallback={
        <span
          aria-hidden="true"
          style={{ width: size, height: size, fontSize: size * 0.32 }}
          className="flex shrink-0 items-center justify-center rounded-full bg-lime-soft font-display text-pill-ink"
        >
          {initials(name)}
        </span>
      }
    />
  );
}

/** GET search box: keeps the other filters as hidden fields and starts again from page 1. */
export function SearchBox({ action, q, label, keep = {} }: { action: string; q: string; label: string; keep?: Params }) {
  return (
    <form action={action} className="flex min-h-12 items-center gap-2.5 rounded-full bg-surface px-4 text-ink-soft shadow-[0_0_0_1px_var(--line)] focus-within:ring-2 focus-within:ring-dusk">
      <Search aria-hidden="true" className="size-[18px] shrink-0" />
      <label htmlFor="admin-search" className="sr-only">
        {label}
      </label>
      <input key={q} id="admin-search" type="search" name="q" defaultValue={q} placeholder={label} className="min-w-0 flex-1 bg-transparent text-ink outline-none" />
      {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
    </form>
  );
}

/** Filter chips in one row, e.g. course status. The active one is marked. */
export function Chips({ items }: { items: { label: string; href: string; active: boolean; count?: number }[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((c) => (
        <li key={c.label}>
          <Link
            href={c.href}
            aria-current={c.active ? "true" : undefined}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-[0.86rem] shadow-[0_0_0_1px_var(--line)] hover:bg-lime-soft/60",
              c.active ? "bg-lime-soft font-medium text-pill-ink" : "bg-surface text-ink-soft",
            )}
          >
            {c.label}
            {c.count != null && <span className="tabular-nums opacity-70">{n(c.count)}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Previous / next links with "51–100 of 340". */
export function Pager({ page, total, size, link }: { page: number; total: number; size: number; link: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const from = page * size + 1;
  const to = Math.min(total, (page + 1) * size);
  const btn = "inline-flex min-h-10 items-center gap-1 rounded-full bg-surface px-4 text-[0.9rem] shadow-[0_0_0_1px_var(--line)] hover:bg-lime-soft/60";
  const off = "pointer-events-none opacity-40";
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-[0.88rem] text-ink-soft tabular-nums">
        {n(from)}–{n(to)} of {n(total)}
      </span>
      <span className="flex gap-2">
        <Link href={link(page)} aria-disabled={page === 0} className={cn(btn, page === 0 && off)}>
          <ChevronLeft aria-hidden="true" className="size-4" /> Previous
        </Link>
        <Link href={link(page + 2)} aria-disabled={page >= pages - 1} className={cn(btn, page >= pages - 1 && off)}>
          Next <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </span>
    </nav>
  );
}

/** A sortable column header: a link that sorts by this column (always biggest first). */
export function SortHeader({ label, active, link, className }: { label: string; active: boolean; link: string; className?: string }) {
  return (
    <th scope="col" aria-sort={active ? "descending" : undefined} className={cn("px-3 py-2.5 text-right font-medium whitespace-nowrap", className)}>
      <Link href={link} className={cn("hover:text-ink", active ? "text-ink underline underline-offset-4" : "text-ink-soft")}>
        {label}
        {active && <span aria-hidden="true"> ↓</span>}
      </Link>
    </th>
  );
}

export const table = "w-full min-w-[880px] border-collapse text-[0.9rem]";
export const tableWrap = "overflow-x-auto rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]";
export const td = "px-3 py-2.5 text-right tabular-nums whitespace-nowrap";
export const tr = "border-t border-line hover:bg-lime-soft/30";
