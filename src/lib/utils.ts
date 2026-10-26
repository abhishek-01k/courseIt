export { cn } from "cn"

/** 22325 → "6h 12m", 754 → "12m" */
export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];

/** "today", "2 days ago", "3 weeks ago". */
export function timeAgo(date: Date, now = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  if (Math.abs(seconds) < 86400) return "today";
  const [unit, size] = STEPS.find(([, s]) => Math.abs(seconds) >= s) ?? ["day", 86400];
  return rtf.format(Math.round(seconds / size), unit);
}

/** 4:05, or 1:02:05 past an hour. */
export function formatClock(seconds: number) {
  const t = Math.max(0, Math.floor(seconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = String(t % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** "Ada Lovelace" → "AL", for an avatar without a photo. */
export const initials = (name: string | null) =>
  (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
