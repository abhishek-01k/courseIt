import { NotebookPen, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import { auth } from "@/lib/auth";
import { notesPath } from "@/lib/paths";
import { timeAgo } from "@/lib/utils";
import { getNoteCourses } from "./queries";

type Search = Promise<Record<string, string | string[] | undefined>>;

const readQuery = async (searchParams: Search) => {
  const { q } = await searchParams;
  return (typeof q === "string" ? q : "").trim().slice(0, 80);
};

async function CourseTiles({ searchParams }: { searchParams: Search }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const q = await readQuery(searchParams);
  const list = await getNoteCourses(session.user.id, q);
  const total = list.reduce((t, c) => t + c.notes, 0);

  return (
    <>
      <form action="/notes" className="flex min-h-12 items-center gap-2.5 rounded-full bg-surface px-4 text-ink-soft shadow-[0_0_0_1px_var(--line)] focus-within:ring-2 focus-within:ring-dusk">
        <Search aria-hidden="true" className="size-[18px] shrink-0" />
        <label htmlFor="notes-search" className="sr-only">
          Find a course in your notes
        </label>
        <input key={q} id="notes-search" type="search" name="q" defaultValue={q} placeholder="Find a course…" className="min-w-0 flex-1 bg-transparent text-ink outline-none" />
      </form>

      {!list.length ? (
        q ? (
          <EmptyState icon={NotebookPen} title="No course matches" text={`None of your courses with notes match “${q}”.`} />
        ) : (
          <EmptyState icon={NotebookPen} title="No notes yet" text="Write in “My notes” under any lesson. Each course you write in gets a place here." />
        )
      ) : (
        <>
          <p className="-mt-2 text-ink-soft tabular-nums">
            {total} {total === 1 ? "note" : "notes"} in {list.length} {list.length === 1 ? "course" : "courses"}. Pick a course to read its notes, lesson by lesson.
          </p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-[18px]">
            {list.map((c) => (
              <li key={c.id} className="flex">
                <Link
                  href={notesPath(c.slug)}
                  className="flex w-full flex-col gap-3 rounded-card bg-surface p-2.5 shadow-[0_0_0_1px_var(--line)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_30px_60px_-30px_rgba(22,49,92,0.45),0_0_0_1px_var(--line)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <span className="relative aspect-video overflow-hidden rounded-2xl bg-lime-soft">
                    {c.thumbnail && <Image src={c.thumbnail} alt="" fill sizes="(min-width: 768px) 360px, 100vw" className="object-cover" />}
                  </span>
                  <span className="flex flex-col gap-1.5 px-2 pb-2">
                    <span className="line-clamp-2 text-h3 font-medium">{c.title}</span>
                    <span className="text-[0.9rem] font-medium">{c.channel}</span>
                    <span className="mt-1 flex justify-between gap-3 border-t pt-2.5 text-[0.85rem] text-ink-soft tabular-nums">
                      <span>
                        {c.notes} {c.notes === 1 ? "note" : "notes"}
                      </span>
                      {c.edited && <span>Edited {timeAgo(c.edited)}</span>}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

// Storyboard frame 11: a tile per course you've written notes in. A course opens its notes by lesson.
export default function NotesPage({ searchParams }: { searchParams: Search }) {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pt-8 pb-20 sm:px-6">
      <PageHeader label="Notes" title="Your notes," accent="course by course." />
      <Suspense fallback={<div aria-hidden="true" className="h-64 rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]" />}>
        <CourseTiles searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
