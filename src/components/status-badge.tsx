import { cn } from "@/lib/utils";

const TONES = {
  ok: "bg-ok-bg text-ok-fg",
  warn: "bg-warn-bg text-warn-fg",
  err: "bg-err-bg text-err-fg",
  idle: "bg-idle-bg text-idle-fg",
};

type StatusBadgeProps = {
  tone: keyof typeof TONES;
  className?: string;
  children: React.ReactNode;
};

// Pill with a 6px dot. Status colours are for progress UI only.
export default function StatusBadge({ tone, className, children }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[0.78rem] font-medium whitespace-nowrap", TONES[tone], className)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
