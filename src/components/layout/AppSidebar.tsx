import { Plus } from "lucide-react";
import Thumbnail from "@/components/thumbnail";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { coursePath } from "@/lib/paths";
import { getEnrolledCourses } from "@/modules/course/queries";
import { getSidebarCounts } from "@/modules/dashboard/queries";
import { getCourseProgress } from "@/modules/roadmap/queries";
import Logo from "./Logo";
import Navbar from "./Navbar";
import SidebarFrame from "./SidebarFrame";
import SidebarNav, { NavList } from "./SidebarNav";
import UserMenu from "./UserMenu";

const mobileNav = "-mx-4 flex-row overflow-x-auto px-4";
const sectionLabel = "px-3 font-mono text-[0.7rem] tracking-[0.07em] text-ink-soft uppercase group-data-[collapsed=true]/side:sr-only";
const navLink = "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-colors hover:bg-lime-soft/60";

async function SidebarUser() {
  const session = await auth();
  const admin = isAdmin(session?.user?.email);
  return <UserMenu name={session?.user?.name ?? "Learner"} image={session?.user?.image} plan={admin ? "Admin" : "Free beta"} admin={admin} />;
}

async function MainNav() {
  const session = await auth();
  const counts = session?.user?.id ? await getSidebarCounts(session.user.id) : undefined;
  return <SidebarNav group="Main" counts={counts} />;
}

// ponytail: the 50 most recent; enough for a scrolling list, page it if someone takes more.
async function SidebarRecents() {
  const session = await auth();
  const userId = session?.user?.id;
  const recents = userId ? await getEnrolledCourses(userId, 50) : [];
  if (!recents.length) return <p className="mx-3 mt-0.5 text-[0.85rem] text-ink-soft group-data-[collapsed=true]/side:hidden">Courses you start will show up here.</p>;
  const progress = await getCourseProgress(userId!, recents.map((c) => c.id));
  return (
    <ul
      aria-label="Recent courses"
      className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain pb-6 [mask-image:linear-gradient(to_bottom,#000_calc(100%-28px),transparent)] [scrollbar-width:thin]"
    >
      {recents.map((course) => (
        <li key={course.id}>
          <Link
            href={coursePath(course.slug)}
            title={course.title}
            className={cn(navLink, "gap-2.5 px-2.5 text-[0.9rem] group-data-[collapsed=true]/side:justify-center group-data-[collapsed=true]/side:px-0")}
          >
            <span className="relative size-7 shrink-0 overflow-hidden rounded-lg bg-lime-soft">
              <Thumbnail src={course.thumbnail} fill sizes="28px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1 truncate group-data-[collapsed=true]/side:sr-only">{course.title}</span>
            <span className="font-mono text-[0.68rem] text-ink-soft tabular-nums group-data-[collapsed=true]/side:hidden">{progress.get(course.id)?.pct ?? 0}%</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const userFallback = <div aria-hidden="true" className="h-[58px] rounded-[18px] bg-surface shadow-[0_0_0_1px_var(--line)]" />;

/**
 * Signed in: the sidebar (and a top bar on phones). Signed out, which only happens on a shared course or
 * roadmap link: the site's public top bar instead, so the page reads like the landing site.
 */
async function Chrome() {
  const session = await auth();
  if (!session?.user) {
    return (
      <>
        <Navbar />
        <div aria-hidden="true" className="h-[84px] shrink-0" />
      </>
    );
  }
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

      <SidebarFrame logo={<Logo />}>
        <Link
          href="/new"
          title="New course"
          className={cn(buttonVariants({ size: "lg" }), "w-full shrink-0 group-data-[collapsed=true]/side:px-0")}
        >
          <Plus aria-hidden="true" className="size-4" />
          <span className="group-data-[collapsed=true]/side:sr-only">New course</span>
        </Link>

        <Suspense fallback={<NavList group="Main" />}>
          <MainNav />
        </Suspense>

        {/* Only this list scrolls: logo, nav, Explore and the account stay put however many courses you take. */}
        <div className="flex min-h-[120px] flex-1 flex-col gap-1">
          <span className={sectionLabel}>Recents</span>
          <Suspense>
            <SidebarRecents />
          </Suspense>
        </div>

        <div className="flex shrink-0 flex-col gap-0.5">
          <span className={sectionLabel}>Explore</span>
          <Suspense fallback={<NavList group="Explore" />}>
            <SidebarNav group="Explore" />
          </Suspense>
        </div>

        <div className="shrink-0">
          <Suspense fallback={userFallback}>
            <SidebarUser />
          </Suspense>
        </div>
      </SidebarFrame>
    </>
  );
}

export default function AppSidebar() {
  return (
    <Suspense fallback={<aside aria-hidden="true" className="sticky top-0 hidden h-dvh w-[248px] shrink-0 border-r bg-sidebar lg:block" />}>
      <Chrome />
    </Suspense>
  );
}
