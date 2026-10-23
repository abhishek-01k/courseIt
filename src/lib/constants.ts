import type { NavLink } from "@/types/navbar";
import type { PaceOption } from "@/types/pace-picker";
import type { TourStep } from "@/types/product-preview";
import type { Testimonial } from "@/types/testimonials";
import type { ModelRole, Stat } from "@/types/under-the-hood";

export const NAV_LINKS: NavLink[] = [
  { id: 1, title: "Features", href: "/#features" },
  { id: 2, title: "How it works", href: "/#how-it-works" },
];

export const TOUR_STEPS: TourStep[] = [
  { id: 1, label: "Paste a link", progress: 100 },
  { id: 2, label: "Skip what you know", progress: 55 },
  { id: 3, label: "Learn the lesson", progress: 0 },
  { id: 4, label: "Replay what you missed", progress: 0 },
  { id: 5, label: "Prove it", progress: 0 },
];

export const PACE_OPTIONS: PaceOption[] = [
  { minutes: 15, finishBy: "Dec 4" },
  { minutes: 30, finishBy: "Nov 21" },
  { minutes: 60, finishBy: "Nov 7" },
];

export const MODEL_ROLES: ModelRole[] = [
  {
    id: 1,
    tag: "Nemotron 3 Ultra",
    title: "Builds the concept map",
    description: "Reads the whole transcript once, maps every concept to its timestamp, splits lessons and writes chapter tests.",
  },
  {
    id: 2,
    tag: "Nemotron 3.5 Lightning",
    title: "Writes every quiz",
    description: "Placement test, lesson quizzes and study notes, fast enough to feel instant.",
  },
  {
    id: 3,
    tag: "Nemotron 3 Super",
    title: "Tutors you",
    description: "After a wrong answer, explains it a different way and asks a fresh question.",
  },
  { id: 4, tag: "Tavily", title: "Finds what to read next", description: "Searches the web for the best article or doc for each chapter." },
];

export const STATS: Stat[] = [
  { id: 1, value: "~$0.06", label: "Estimated model cost to build a 3-hour course, made once and shared by every learner" },
  { id: 2, value: "< 60 s", label: "Target time from pasted link to a ready course for a 1-hour video" },
  { id: 3, value: "0", label: "Videos downloaded. Everything plays in YouTube's own player" },
];

// Empty until real tester quotes are collected; the section hides itself while empty.
export const TESTIMONIALS: Testimonial[] = [];
