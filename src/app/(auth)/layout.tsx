import { Navbar, SaleBanner } from "@/components/layout";

// Sign-in screens: exactly one viewport tall, no footer, no page scroll.
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SaleBanner variant="fixed" href="/pricing" />
      <Navbar />
      <main className="h-[calc(100dvh-var(--sale-bar,0px))] overflow-hidden">{children}</main>
    </>
  );
}
