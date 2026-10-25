import { Suspense } from "react";
import Landscape from "@/components/landscape";
import Pill from "@/components/pill";
import { auth } from "@/lib/auth";
import CourseUrlForm from "./course-url-form";

async function FirstName() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0];
  return firstName ? (
    <>
      , <em className="italic text-moss">{firstName}</em>?
    </>
  ) : (
    "?"
  );
}

export default function StartCourse() {
  return (
    <section aria-labelledby="start-title" className="relative overflow-hidden rounded-panel shadow-blue">
      <Landscape scene="sunrise" className="dark:hidden" />
      <Landscape scene="night" className="hidden dark:block" />

      <div className="relative flex justify-center px-4 py-14 sm:px-6 sm:py-20">
        <div className="glass flex w-full max-w-[680px] flex-col items-center gap-5 rounded-[28px] px-5 py-8 text-center sm:px-10 sm:py-10">
          <Pill>Welcome to CourseIt</Pill>
          <h1 id="start-title" className="text-[clamp(2rem,4vw,2.8rem)] leading-[1.08]">
            What should we learn
            <Suspense fallback="?">
              <FirstName />
            </Suspense>
          </h1>
          <CourseUrlForm />
        </div>
      </div>
    </section>
  );
}
