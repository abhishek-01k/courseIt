import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import NewRoadmapForm from "./components/new-roadmap-form";
import RoadmapCard from "./components/roadmap-card";
import { getMyRoadmaps } from "./queries";

async function Mine() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const mine = await getMyRoadmaps(session.user.id);
  return (
    <section aria-labelledby="mine-title" className="flex flex-col gap-3.5">
      <h2 id="mine-title" className="flex items-baseline gap-2 text-[1.6rem]">
        Yours <span className="text-[1rem] text-ink-soft tabular-nums">{mine.length}</span>
      </h2>
      {mine.length ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-[18px]">
          {mine.map((r) => (
            <li key={r.id} className="flex">
              <RoadmapCard roadmap={r} variant="mine" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-soft">No roadmaps yet. Name one above, or start from one in Community.</p>
      )}
    </section>
  );
}

export default function MyRoadmapsPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pt-8 pb-20 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-label tracking-[0.07em] text-ink-soft uppercase">Roadmaps</span>
          <h1 className="text-[clamp(2rem,4vw,2.6rem)] leading-[1.08]">
            Your learning <em className="italic text-moss">paths.</em>
          </h1>
          <p className="max-w-[560px] text-ink-soft">A roadmap is your own set of courses from different creators, in stages. Private until you publish it to Community.</p>
        </div>
        <Link href="/community?tab=roadmaps" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Browse community roadmaps
        </Link>
      </header>
      <NewRoadmapForm />
      <Suspense fallback={<div aria-hidden="true" className="h-64 rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]" />}>
        <Mine />
      </Suspense>
    </div>
  );
}
