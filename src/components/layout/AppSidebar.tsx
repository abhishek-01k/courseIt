import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { coursePath } from "@/lib/paths";
import { getEnrolledCourses } from "@/modules/course/queries";
import Logo from "./Logo";
import SidebarNav, { NavList } from "./SidebarNav";
import UserMenu from "./UserMenu";

const mobileNav = "-mx-4 flex-row overflow-x-auto px-4";
const sectionLabel = "px-3 font-mono text-[0.7rem] tracking-[0.07em] text-ink-soft uppercase";
const navLink = "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-colors hover:bg-lime-soft/60";

async function SidebarUser() {
  const session = await auth();
  return <UserMenu name={session?.user?.name ?? "Learner"} image={session?.user?.image} plan="Free beta" />;
}

async function SidebarRecents() {
  const session = await auth();
  const recents = session?.user?.id ? await getEnrolledCourses(session.user.id, 3) : [];
  if (!recents.length) return <p className="mx-3 mt-0.5 text-[0.85rem] text-ink-soft">Courses you start will show up here.</p>;
  return (
    <ul className="flex flex-col gap-0.5">
      {recents.map((course) => (
        <li key={course.id}>
          <Link href={coursePath(course.slug)} className={cn(navLink, "gap-2.5 px-2.5 text-[0.9rem]")}>
            <span className="relative size-7 shrink-0 overflow-hidden rounded-lg bg-lime-soft">
              {course.thumbnail && <Image src={course.thumbnail} alt="" fill sizes="28px" className="object-cover" />}
            </span>
            <span className="truncate">{course.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const userFallback = <div aria-hidden="true" className="h-[58px] rounded-[18px] bg-surface shadow-[0_0_0_1px_var(--line)]" />;

export default function AppSidebar() {
  return (
    <>
      <header className="sticky top-0 z-40 flex flex-col gap-2 border-b bg-paper/85 px-4 py-2.5 backdrop-blur-[14px] lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <div className="w-[210px]">
            <Suspense fallback={userFallback}>
              <SidebarUser />
            </Suspense>
          </div>
        </div>
        <Suspense fallback={<NavList group="All" className={mobileNav} />}>
          <SidebarNav group="All" className={mobileNav} />
        </Suspense>
      </header>

      <aside aria-label="App" className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-[18px] border-r bg-sidebar px-3.5 py-[18px] lg:flex">
        <div className="px-1.5">
          <Logo />
        </div>

        <Link href="/dashboard#course-url" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          <Plus aria-hidden="true" className="size-4" />
          New course
        </Link>

        <Suspense fallback={<NavList group="Main" />}>
          <SidebarNav group="Main" />
        </Suspense>

        <div className="flex flex-col gap-1">
          <span className={sectionLabel}>Recents</span>
          <Suspense>
            <SidebarRecents />
          </Suspense>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className={sectionLabel}>Explore</span>
          <Suspense fallback={<NavList group="Explore" />}>
            <SidebarNav group="Explore" />
          </Suspense>
        </div>

        <div className="mt-auto">
          <Suspense fallback={userFallback}>
            <SidebarUser />
          </Suspense>
        </div>
      </aside>
    </>
  );
}
