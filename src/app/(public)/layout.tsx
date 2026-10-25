import { Footer, Navbar } from "@/components/layout";
import SmoothScroll from "@/components/smooth-scroll";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Smooth scrolling is for the landing pages only: in the app it would hijack the wheel inside
  // scrollable panels (the lesson playlist, the quiz dialog, notes).
  return (
    <SmoothScroll>
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </SmoothScroll>
  );
}
