import type { LucideIcon } from "lucide-react";

// Placeholder for signed-in pages that have no data yet.
export default function EmptyState({ icon: Icon, title, text, children }: { icon: LucideIcon; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-14 text-center shadow-[0_0_0_1px_var(--line)]">
      <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-lime-soft text-pill-ink">
        <Icon className="size-5" />
      </span>
      <h2 className="text-h3 font-medium">{title}</h2>
      <p className="max-w-[420px] text-ink-soft">{text}</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
