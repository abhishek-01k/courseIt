import { AppSidebar, SaleBanner } from "@/components/layout";

// Every page with the sidebar. Full-screen pages (the course onboarding) live outside this group.
// A shared course or roadmap opened signed out gets the public top bar instead (see AppSidebar).
// The sale bar sits at the top of <main>, beside the sidebar: above the whole shell it would push the full-height
// sticky sidebar down and cut off its bottom.
export default function ShellLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:has-[>aside]:flex-row">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <SaleBanner variant="inline" href="/plans" />
        {children}
      </main>
    </div>
  );
}
