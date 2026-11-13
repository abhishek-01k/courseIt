import { Footer, Navbar } from "@/components/layout";
import NvidiaInceptionBadge from "@/components/nvidia-inception-badge";
import SmoothScroll from "@/components/smooth-scroll";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Smooth scrolling is for the landing pages only: in the app it would hijack the wheel inside
  // scrollable panels (the lesson playlist, the quiz dialog, notes).
  return (
    <SmoothScroll>
      <Navbar />
      {/* Pinned to the window's top-right corner, beside the floating nav. Only on wide screens (xl), where there's room
          next to the 880px nav; on smaller screens the hero pill and the footer badge carry it. */}
      <div className="fixed top-[24px] right-6 z-[60] hidden xl:block">
        <NvidiaInceptionBadge height={40} />
      </div>
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </SmoothScroll>
  );
}
