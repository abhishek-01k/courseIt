import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { buildBlock, isPaid, usageFor } from "@/lib/billing";
import CourseUrlForm from "./course-url-form";

async function Form({ caption }: { caption?: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return <CourseUrlForm caption={caption} />;
  const usage = await usageFor(userId);
  return <CourseUrlForm caption={caption} blocked={buildBlock(usage)} isPaid={isPaid(usage)} />;
}

/** The "paste a YouTube link" form, locked when the learner has no builds left on their plan. */
export default function BuildCourseForm({ caption }: { caption?: string }) {
  return (
    <Suspense fallback={<CourseUrlForm caption={caption} />}>
      <Form caption={caption} />
    </Suspense>
  );
}
