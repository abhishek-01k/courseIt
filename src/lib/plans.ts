// Plans and their limits: change a number here and the pricing page, the limit checks and Settings all follow.
// Only *building* a new course counts. Joining a course someone already built is free on every plan,
// because it costs nothing to serve.
export type PlanId = "free" | "pro" | "max";
export type Interval = "month" | "year";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  price: Record<Interval, number>; // USD; yearly is charged once a year
  coursesPerMonth: number; // new courses in any 30 days
  maxHours: number; // longest video or playlist one course can be built from
  perks: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Try it on one course.",
    price: { month: 0, year: 0 },
    coursesPerMonth: 1,
    maxHours: 2,
    perks: ["Join any course already built, free forever", "Notes, quizzes and placement tests", "Roadmaps and daily plans"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For learning something every week.",
    price: { month: 19, year: 190 },
    coursesPerMonth: 5,
    maxHours: 10,
    perks: ["Everything in Free", "Long playlists, up to 10 hours", "Retry any lesson that didn't build"],
  },
  max: {
    id: "max",
    name: "Max",
    tagline: "For heavy learners and teams of one.",
    price: { month: 59, year: 590 },
    coursesPerMonth: 25,
    maxHours: 20,
    perks: ["Everything in Pro", "Full courses, up to 20 hours", "Early access to new features"],
  },
};

export const PAID_PLANS = [PLANS.pro, PLANS.max];

/** Dodo product ids, one per plan and interval. Create the 4 subscription products in Dodo and paste their ids. */
export const productIdFor = (plan: PlanId, interval: Interval) =>
  ({
    "pro:month": process.env.DODO_PRODUCT_PRO_MONTHLY,
    "pro:year": process.env.DODO_PRODUCT_PRO_YEARLY,
    "max:month": process.env.DODO_PRODUCT_MAX_MONTHLY,
    "max:year": process.env.DODO_PRODUCT_MAX_YEARLY,
  })[`${plan}:${interval}`] || null;

export function planForProduct(productId: string): PlanId | null {
  for (const plan of ["pro", "max"] as const) {
    for (const interval of ["month", "year"] as const) if (productIdFor(plan, interval) === productId) return plan;
  }
  return null;
}
