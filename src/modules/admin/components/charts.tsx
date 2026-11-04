import { n } from "./ui";

const shortDay = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });

/**
 * One series of daily counts as thin bars (single hue, so no legend: the title names it). Each column is a
 * full-height hover target with its own tooltip; a hidden table carries the same numbers for screen readers.
 */
export function DayBars({ title, points, unit }: { title: string; points: { day: string; value: number }[]; unit: string }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((t, p) => t + p.value, 0);
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">{title}</span>
        <span className="text-[0.85rem] text-ink-soft tabular-nums">
          peak {n(max)} · {n(total)} in 30 days
        </span>
      </figcaption>
      <div aria-hidden="true" className="relative h-36 border-b border-line">
        <span className="absolute top-0 left-0 text-[0.72rem] text-ink-soft tabular-nums">{n(max)}</span>
        <ol className="flex h-full items-end gap-[2px] pl-7">
          {points.map((p) => (
            <li key={p.day} className="group relative flex h-full flex-1 items-end">
              <span
                className="w-full rounded-t-[4px] bg-moss transition-opacity group-hover:opacity-80"
                style={{ height: p.value ? `${Math.max(3, (p.value / max) * 100)}%` : 0 }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-ink px-2 py-1 text-[0.75rem] whitespace-nowrap text-paper tabular-nums group-hover:block">
                {shortDay(p.day)} · {n(p.value)} {unit}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div aria-hidden="true" className="flex justify-between pl-7 text-[0.72rem] text-ink-soft">
        <span>{points[0] && shortDay(points[0].day)}</span>
        <span>{points.at(-1) && shortDay(points.at(-1)!.day)}</span>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.day}>
              <td>{p.day}</td>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** The last 26 weeks as a grid of days (columns are weeks, Sunday on top); filled = they opened CourseIt. */
export function ActivityCalendar({ days }: { days: string[] }) {
  const active = new Set(days);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 7 * 25 - start.getUTCDay()); // a Sunday, 25 full weeks back
  const cells: { day: string; on: boolean; future: boolean }[] = [];
  for (const d = new Date(start); cells.length < 26 * 7; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    cells.push({ day, on: active.has(day), future: d > today });
  }
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-[0.85rem] text-ink-soft tabular-nums">
        {n(days.length)} active {days.length === 1 ? "day" : "days"} in the last 26 weeks
      </figcaption>
      <div className="overflow-x-auto">
        <ol role="list" aria-label="Active days" className="grid w-max grid-flow-col grid-rows-7 gap-[3px]">
          {cells.map((c) => (
            <li
              key={c.day}
              title={c.future ? undefined : `${shortDay(c.day)}${c.on ? " · active" : ""}`}
              className={c.future ? "size-3" : c.on ? "size-3 rounded-[3px] bg-moss" : "size-3 rounded-[3px] bg-line"}
            >
              {c.on && <span className="sr-only">{c.day}</span>}
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
