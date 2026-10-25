import { AppSidebar } from "@/components/layout";
import RecordVisit from "@/components/layout/RecordVisit";

// src/proxy.ts sends signed-out visitors to /login; session reads sit inside <Suspense>.
export default function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <RecordVisit />
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
