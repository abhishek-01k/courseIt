import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import PopularCourses from "./components/popular-courses";
import ReturningToday from "./components/returning-today";
import StartCourse from "./components/start-course";
import { getContinue, getGreeting, getMyCourses, getTimezone, getWeekStats } from "./queries";

// New learners get the welcome with the paste box and popular courses; once they've started a course,
// Today becomes the daily view (storyboard frame 8).
async function Today() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  // Two rounds: the course list and timezone, then the day plans and the week's stats side by side.
  const zone = getTimezone(userId);
  const [myCourses, stats, timezone] = await Promise.all([getMyCourses(userId), zone.then((z) => getWeekStats(userId, z)), zone]);
  if (!myCourses.length) {
    return (
      <>
        <StartCourse />
        <PopularCourses />
      </>
    );
  }
  return (
    <ReturningToday
      firstName={session.user?.name?.split(" ")[0] ?? null}
      greeting={getGreeting(timezone)}
      resume={getContinue(myCourses[0])}
      stats={stats}
      myCourses={myCourses}
    />
  );
}

function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6">
      <Skeleton className="h-[300px] rounded-panel" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-card" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8 px-4 pt-8 pb-20 sm:px-6">
      <Suspense fallback={<TodaySkeleton />}>
        <Today />
      </Suspense>
    </div>
  );
}
