// Title block at the top of each signed-in page.
export default function PageHeader({ label, title, accent }: { label: string; title: string; accent: string }) {
  return (
    <header className="flex flex-col gap-2">
      <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">{label}</span>
      <h1 className="text-[clamp(2rem,4vw,2.6rem)] leading-[1.08]">
        {title} <em className="italic text-moss">{accent}</em>
      </h1>
    </header>
  );
}
