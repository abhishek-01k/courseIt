import RecordVisit from "@/components/layout/RecordVisit";

// src/proxy.ts sends signed-out visitors to /login; session reads sit inside <Suspense>.
// Pages with the sidebar are in (shell); full-screen ones (like /build/[slug]) sit beside it.
export default function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <RecordVisit />
      {children}
    </>
  );
}
