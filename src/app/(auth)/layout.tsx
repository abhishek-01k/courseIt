import { Navbar } from "@/components/layout";

// Sign-in screens: exactly one viewport tall, no footer, no page scroll.
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      <main className="h-dvh overflow-hidden">{children}</main>
    </>
  );
}
