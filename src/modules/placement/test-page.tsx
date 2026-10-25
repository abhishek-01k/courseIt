import { Loader2 } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import FocusHeader from "@/components/focus-header";
import { auth } from "@/lib/auth";
import { buildPath, coursePath } from "@/lib/paths";
import RefreshWhileBuilding from "@/modules/course/components/refresh-while-building";
import { getCourseBySlug } from "@/modules/course/queries";
import PlacementQuiz from "./components/placement-quiz";
import { getPlacementTest } from "./queries";

export default async function TestPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, session] = await Promise.all([params, auth()]);
  if (!session?.user?.id) redirect("/login");
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const test = await getPlacementTest(course.id);
  const building = course.status !== "ready" && course.status !== "failed";

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <FocusHeader backHref={buildPath(slug)} backLabel="Back">
        <span className="hidden font-mono text-label tracking-[0.07em] text-ink-soft uppercase sm:inline">Placement test · {course.title}</span>
        <Link href={coursePath(slug)} className="text-[0.9rem] text-ink-soft underline-offset-4 hover:text-ink hover:underline">
          Skip the test
        </Link>
      </FocusHeader>
      <main className="mx-auto w-full max-w-[760px] px-4 pt-11 pb-16 sm:px-6">
        {test.length ? (
          <PlacementQuiz courseId={course.id} questions={test} />
        ) : building ? (
          <p className="flex items-center gap-2.5 text-ink-soft">
            <RefreshWhileBuilding />
            <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            Nemotron 3 Ultra is writing your placement test. It&apos;s ready in a few seconds.
          </p>
        ) : (
          <p className="text-ink-soft">
            There&apos;s no placement test for this course.{" "}
            <Link href={coursePath(slug)} className="font-medium text-moss underline-offset-4 hover:underline">
              Go to the course
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
