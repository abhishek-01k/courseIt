import { BookOpen, Home, Map as MapIcon, NotebookPen, Users } from "lucide-react";
import type { AppNavLink } from "@/types/app-sidebar";
import type { LessonFormat } from "@/types/format-toggle";
import type { HowStep } from "@/types/how-it-works";
import type { LandscapePalette, LandscapeScene } from "@/types/landscape";
import type { AuthProvider } from "@/types/login";
import type { NavLink } from "@/types/navbar";
import type { PaceOption } from "@/types/pace-picker";
import type { PopularCourse } from "@/types/popular-courses";
import type { TourStep } from "@/types/product-preview";
import type { Testimonial } from "@/types/testimonials";
import type { TrustStat } from "@/types/trusted-by";

// PLACEHOLDERS: fill these in before launch. They appear on the Privacy and Terms pages.
export const LEGAL = {
  operator: "Triggerfy Services",
  contactEmail: "hello@triggerfy.xyz",
  jurisdiction: "India",
  lastUpdated: "October 24, 2026",
};

export const LEGAL_LINKS: NavLink[] = [
  { id: 1, title: "Privacy", href: "/privacy" },
  { id: 2, title: "Terms", href: "/terms" },
];

// Brand marks from Simple Icons (CC0), drawn in the current text colour.
export const AUTH_PROVIDERS: AuthProvider[] = [
  {
    id: "google",
    label: "Continue with Google",
    iconPath:
      "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z",
  },
  {
    id: "github",
    label: "Continue with GitHub",
    iconPath:
      "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  },
  {
    id: "twitter",
    label: "Continue with X",
    iconPath: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  },
];

export const NAV_LINKS: NavLink[] = [
  { id: 1, title: "Features", href: "/#features" },
  { id: 2, title: "Courses", href: "/#courses" },
  { id: 3, title: "How it works", href: "/#how-it-works" },
  { id: 4, title: "Stories", href: "/#stories" },
];

// Signed-in sidebar. Each href also needs a matcher entry in src/proxy.ts.
export const APP_NAV_LINKS: AppNavLink[] = [
  { id: 1, title: "Today", href: "/dashboard", icon: Home },
  { id: 2, title: "My courses", href: "/courses", icon: BookOpen },
  { id: 3, title: "Roadmaps", href: "/roadmaps", icon: MapIcon },
  { id: 4, title: "Notes", href: "/notes", icon: NotebookPen },
];

export const APP_EXPLORE_LINKS: AppNavLink[] = [{ id: 1, title: "Community", href: "/community", icon: Users }];

export const LANDSCAPE_PALETTES: Record<LandscapeScene, LandscapePalette> = {
  sunrise: {
    sky: ["#fcfcfa", "#f8e9de", "#f4dccb"],
    far: "#cdb9cc",
    snow: "#fbefe6",
    mid: ["#8c97cb", "#7482bf"],
    lake: ["#9fb0e0", "#c7cdeb"],
    sheen: "#f8dcc4",
    shore: "#2e4636",
    pine: "#1e3326",
    hills: ["#56722a", "#6a8733", "#87a23f"],
    flower: "#ffffff",
    cloud: "#f7d2b6",
    cloudShade: "#dcc3d8",
    bird: "#4c4c3d",
    star: "transparent",
    moon: "transparent",
  },
  dusk: {
    sky: ["#2e4699", "#6f82cc", "#f0c2a0"],
    far: "#3e52a0",
    snow: "#c9d2f0",
    mid: ["#2a3d86", "#22336f"],
    lake: ["#2b418c", "#4b60ae"],
    sheen: "#f2c7a8",
    shore: "#0f2230",
    pine: "#0b1a24",
    hills: ["#1c3527", "#21402d", "#2a4d33"],
    flower: "#e9dceb",
    cloud: "#edb99b",
    cloudShade: "#a5aedb",
    bird: "#16315c",
    star: "transparent",
    moon: "transparent",
  },
  night: {
    sky: ["#0e1311", "#122340", "#16315c"],
    far: "#26355f",
    snow: "#7383b5",
    mid: ["#1c2a50", "#162244"],
    lake: ["#13274b", "#1b3360"],
    sheen: "#d8cfa6",
    shore: "#07110d",
    pine: "#06100b",
    hills: ["#132016", "#17271a", "#1c2f1f"],
    flower: "#9aa3c6",
    cloud: "#2c3a60",
    cloudShade: "#212c4c",
    bird: "transparent",
    star: "#e9e4cf",
    moon: "#f1ead0",
  },
};

export const TOUR_STEPS: TourStep[] = [
  { id: 1, label: "Paste a link", progress: 100 },
  { id: 2, label: "Skip what you know", progress: 55 },
  { id: 3, label: "Learn the lesson", progress: 0 },
  { id: 4, label: "Replay what you missed", progress: 0 },
  { id: 5, label: "Prove it", progress: 0 },
];

export const LESSON_FORMATS: LessonFormat[] = ["Video", "Article"];

export const PACE_OPTIONS: PaceOption[] = [
  { minutes: 15, finishBy: "Dec 4" },
  { minutes: 30, finishBy: "Nov 21" },
  { minutes: 60, finishBy: "Nov 7" },
];

export const HOW_STEPS: HowStep[] = [
  {
    id: 1,
    title: "Paste a link",
    description: "Drop in any YouTube video or playlist. Nemotron maps every concept in under a minute.",
    numeralClass: "text-moss",
  },
  {
    id: 2,
    title: "Learn at your pace",
    description: "A 2-minute placement test skips what you know. Pick 15, 30 or 60 minutes a day.",
    numeralClass: "text-[#82913a] dark:text-[#97a646]",
  },
  {
    id: 3,
    title: "Prove it",
    description: "Pass a short quiz to count the day. Miss one and CourseIt replays the exact moment that explains it.",
    numeralClass: "text-lime dark:text-[#6f7e2c]",
  },
];

// DUMMY sample data for the design. Replace with real numbers, courses and quotes before launch.
export const TRUST_STATS: TrustStat[] = [
  { id: 1, label: "Learners", value: "48,000+" },
  { id: 2, label: "Courses built", value: "9,200+" },
  { id: 3, label: "Completion rate", value: "64%" },
  { id: 4, label: "Avg. streak", value: "11 days" },
];

export const TOPICS = ["Python", "React", "DSA", "SQL", "System design", "Machine learning"];

export const POPULAR_COURSES: PopularCourse[] = [
  { id: 1, title: "React from zero", channel: "Code with Aria", meta: "14 lessons · 6h 02m · Beginner", length: "6:02:14", learners: "2,140", glyph: "</>", tone: "bg-[#e4e9c6] text-[#4b5e1e]", badge: "Popular" },
  { id: 2, title: "Python for data analysis", channel: "Data Diaries", meta: "22 lessons · 9h 10m · Beginner", length: "9:10:05", learners: "1,870", glyph: "py", tone: "bg-[#ecedf3] text-[#445eb2]" },
  { id: 3, title: "System design basics", channel: "Byte Sized Eng", meta: "9 lessons · 3h 45m · Intermediate", length: "3:45:30", learners: "1,320", glyph: "{ }", tone: "bg-[#f7e9da] text-[#9a5a22]", badge: "New" },
  { id: 4, title: "SQL in one weekend", channel: "Query Club", meta: "8 lessons · 2h 20m · Beginner", length: "2:20:48", learners: "960", glyph: "SQL", tone: "bg-[#eef2da] text-[#3c4c16]" },
  { id: 5, title: "DSA for interviews", channel: "LeetLoop", meta: "31 lessons · 14h 05m · Intermediate", length: "14:05:12", learners: "3,410", glyph: "O(n)", tone: "bg-[#e8e2ec] text-[#16315c]", badge: "Popular" },
  { id: 6, title: "Machine learning intro", channel: "Model Minds", meta: "18 lessons · 7h 30m · Beginner", length: "7:30:40", learners: "1,150", glyph: "ML", tone: "bg-[#f6e1dd] text-[#a0473b]" },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    quote: "I had started that 6-hour React video four times. CourseIt cut it to two and a half hours and I finished in nine days.",
    name: "Priya Nair",
    role: "CS student, Pune",
    initials: "PN",
    finished: "Finished: React from zero · 9 days",
  },
  {
    id: 2,
    quote: "Getting a question wrong and landing on the exact 40 seconds that explain it is what made it stick.",
    name: "Marcus Lee",
    role: "Career switcher",
    initials: "ML",
    finished: "Finished: Python for data analysis · 14 days",
  },
  {
    id: 3,
    quote: "No recommendations, no rabbit holes. Thirty minutes a day and a date to finish by.",
    name: "Aiko Tanaka",
    role: "Frontend developer",
    initials: "AT",
    finished: "Finished: System design basics · 6 days",
  },
];

// Protect the AI bill while keeping CourseIt free. Courses someone already built never count.
export const COURSE_LIMITS = {
  newCoursesPerDay: 3,
  maxPlaylistVideos: 200,
  maxTotalSeconds: 12 * 3600,
};

// AI models. Captions come from Supadata; Gemini only watches videos that have none. Every decision and
// every word a learner reads comes from NVIDIA Nemotron on Nebius Token Factory.
export const AI = {
  readerModel: "gemini-3.8-flash",
  nemotron: {
    ultra: "nvidia/Nemotron-3-Ultra-550b-a55b", // serious reasoning: planning a course out of hours of video
    super: "nvidia/nemotron-3-super-120b-a12b", // lesson notes and quizzes, many in parallel
    nano: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B", // instant calls: feedback on a wrong answer, hints, tags
    lightning: "nvidia/Nemotron-3_5-Lightning", // backup when another model is overloaded
  },
  // If a model stays overloaded, the same request moves down its list.
  fallbacks: {
    ultra: ["super", "lightning"],
    super: ["lightning", "nano"],
    nano: ["lightning"],
    lightning: ["nano"],
  } as Record<string, ("ultra" | "super" | "nano" | "lightning")[]>,
  modelNames: { ultra: "Nemotron 3 Ultra", super: "Nemotron 3 Super", nano: "Nemotron 3 Nano", lightning: "Nemotron 3.5 Lightning" },
  segmentSeconds: 10 * 60, // Gemini reads ~5 min of video per minute, so read 10-minute pieces in parallel
  readerFps: 0.25, // one frame every 4s: lectures change slowly, and audio carries most of it
};
