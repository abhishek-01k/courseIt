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
