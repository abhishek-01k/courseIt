import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { buildBlock, usageFor } from "@/lib/billing";
import CourseUrlForm from "./course-url-form";

async function Form({ caption }: { caption?: string }) {
  const session = await auth();
  const userId = session?.user?.id;
  return <CourseUrlForm caption={caption} blocked={userId ? buildBlock(await usageFor(userId)) : null} />;
}

/** The "paste a YouTube link" form, locked when the learner has no builds left on their plan. */
export default function BuildCourseForm({ caption }: { caption?: string }) {
  return (
    <Suspense fallback={<CourseUrlForm caption={caption} />}>
      <Form caption={caption} />
    </Suspense>
  );
}
