import { AppSidebar } from "@/components/layout";

// Every signed-in page with the sidebar. Full-screen pages (the course onboarding) live outside this group.
export default function ShellLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
