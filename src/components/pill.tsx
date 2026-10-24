// Lime-soft eyebrow that sits above each section heading.
export default function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-lime-soft px-3.5 py-[7px] text-[0.78rem] font-medium text-pill-ink">
      {children}
    </span>
  );
}
