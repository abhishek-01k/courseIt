type SectionHeadingProps = {
  label: string;
  before: string;
  accent: string;
  after?: string;
};

export default function SectionHeading({ label, before, accent, after = "" }: SectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tighter text-balance sm:text-5xl">
        {before} <em className="font-serif font-normal italic text-primary">{accent}</em>
        {after}
      </h2>
    </div>
  );
}
