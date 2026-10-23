import type { LessonFormat } from "@/types/format-toggle";
import type { HowStep } from "@/types/how-it-works";
import type { LandscapePalette, LandscapeScene } from "@/types/landscape";
import type { NavLink } from "@/types/navbar";
import type { PaceOption } from "@/types/pace-picker";
import type { PopularCourse } from "@/types/popular-courses";
import type { TourStep } from "@/types/product-preview";
import type { Testimonial } from "@/types/testimonials";
import type { TrustStat } from "@/types/trusted-by";

export const NAV_LINKS: NavLink[] = [
  { id: 1, title: "Features", href: "/#features" },
  { id: 2, title: "Courses", href: "/#courses" },
  { id: 3, title: "How it works", href: "/#how-it-works" },
  { id: 4, title: "Stories", href: "/#stories" },
];

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
