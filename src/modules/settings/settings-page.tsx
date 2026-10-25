import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import PageHeader from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import PacePicker from "./components/pace-picker";

async function DailyTime() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const [user] = await db.select({ minutesPerDay: users.minutesPerDay }).from(users).where(eq(users.id, userId));
  return <PacePicker minutesPerDay={user?.minutesPerDay ?? 90} />;
}

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-8 px-4 pt-8 pb-20 sm:px-6">
      <PageHeader label="Settings" title="Learn at" accent="your pace." />
      <section aria-labelledby="daily-title" className="flex flex-col gap-3">
        <div>
          <h2 id="daily-title" className="text-h3 font-medium">
            Daily learning time
          </h2>
          <p className="text-[0.92rem] text-ink-soft">Every course splits into days from this. Change it any time; your plans update at once.</p>
        </div>
        <Suspense fallback={<Skeleton className="h-36 rounded-card" />}>
          <DailyTime />
        </Suspense>
      </section>
    </div>
  );
}
