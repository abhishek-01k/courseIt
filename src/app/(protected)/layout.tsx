import { Navbar } from "@/components/layout";

// src/proxy.ts sends signed-out visitors to /login; each page also reads the session inside a <Suspense>.
export default function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
