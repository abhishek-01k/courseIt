import { Suspense } from "react";
import Welcome from "./components/welcome";

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 pt-36 pb-24">
      <Suspense fallback={<p className="text-ink-soft">Loading your dashboard…</p>}>
        <Welcome />
      </Suspense>
    </section>
  );
}
