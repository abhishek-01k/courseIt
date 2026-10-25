// Placeholder while a signed-in page streams in, so it never flashes blank.
export default function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="mx-auto flex w-full max-w-[1180px] animate-pulse flex-col gap-5 px-4 pt-8 pb-20 motion-reduce:animate-none sm:px-6">
      <div className="h-9 w-2/3 rounded-xl bg-lime-soft/60" />
      <div className="aspect-[16/7] w-full rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]" />
      <div className="h-20 rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]" />
      <div className="h-20 rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]" />
    </div>
  );
}
