import Link from "next/link";

// Graduation cap with a play button cut out of the board. Colour comes from `currentColor`.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="2 6 60 44" aria-hidden="true" className={className}>
      <path
        fillRule="evenodd"
        d="M32 10 L60 24 L32 38 L4 24 Z M27 15.5 L41 23.5 L27 31.5 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M14 33 L32 42 L50 33 V43 A18 6.5 0 0 1 14 43 Z" fill="currentColor" />
      <path d="M52 28 V36" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="52" cy="37" r="2" fill="currentColor" />
      <path d="M50.6 38.5 H53.4 L55 47 H49 Z" fill="currentColor" />
    </svg>
  );
}

export default function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-display text-[1.15rem] font-medium leading-none tracking-[-0.02em] text-ink">
      <LogoMark className="h-5 w-[27px]" />
      courseit
    </Link>
  );
}
