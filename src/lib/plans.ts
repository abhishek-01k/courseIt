// Plans, limits and regional prices: change a number here and the pricing pages, checkout, the limit checks and
// Settings all follow. Only *building* a new course counts. Joining a course someone already built is free on every
// plan, because it costs nothing to serve.
//
// Limits are sized from build costs (about $0.08 of AI, captions and search per hour of video), so even a learner
// who uses every hour of their plan costs less than the plan brings in, in every region.
export type PlanId = "free" | "pro" | "max";
export type Interval = "month" | "year";
export type Region = "in" | "gb" | "us";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  price: Record<Region, Record<Interval, number>>; // in each region's currency; yearly is charged once a year
  coursesPerMonth: number; // new courses in any 30 days (on Free: ever, see `lifetime`)
  lifetime: boolean; // Free: its 1 course is once per account, not every month
  hoursPerMonth: number; // total video hours those courses may add up to, in any 30 days
  maxHours: number; // longest video or playlist one course can be built from
  perks: string[];
};

/**
 * India: rupees with GST included (what Indian shoppers expect). UK: pounds with VAT included.
 * Everyone else: US dollars, with any sales tax or VAT added at checkout.
 */
export const REGIONS: Record<Region, { currency: string; locale: string; taxNote: string }> = {
  in: { currency: "INR", locale: "en-IN", taxNote: "incl. GST" },
  gb: { currency: "GBP", locale: "en-GB", taxNote: "incl. VAT" },
  us: { currency: "USD", locale: "en-US", taxNote: "USD, plus local taxes" },
};

/** A visitor's country (ISO code, as Vercel sends it) → the prices they see and pay. */
export const regionFor = (country: string | null | undefined): Region => (country === "IN" ? "in" : country === "GB" ? "gb" : "us");

export const formatPrice = (amount: number, region: Region) =>
  new Intl.NumberFormat(REGIONS[region].locale, { style: "currency", currency: REGIONS[region].currency, maximumFractionDigits: 0 }).format(amount);

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Build your first course free.",
    price: { in: { month: 0, year: 0 }, gb: { month: 0, year: 0 }, us: { month: 0, year: 0 } },
    coursesPerMonth: 1,
    lifetime: true,
    hoursPerMonth: 6,
    maxHours: 6,
    perks: ["Join any course already built, free forever", "Notes, quizzes and placement tests", "Roadmaps and daily plans"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For learning something every week.",
    price: { in: { month: 499, year: 4999 }, gb: { month: 15, year: 149 }, us: { month: 19, year: 189 } },
    coursesPerMonth: 5,
    lifetime: false,
    hoursPerMonth: 30,
    maxHours: 10,
    perks: ["Everything in Free", "Long playlists, up to 10 hours each", "Retry any course or lesson that didn't build", "Your builds go first when it's busy", "Chat support on WhatsApp and Telegram"],
  },
  max: {
    id: "max",
    name: "Max",
    tagline: "For heavy learners and teams of one.",
    price: { in: { month: 999, year: 9999 }, gb: { month: 39, year: 389 }, us: { month: 49, year: 489 } },
    coursesPerMonth: 20,
    lifetime: false,
    hoursPerMonth: 100,
    maxHours: 20,
    perks: ["Everything in Pro", "Full courses, up to 20 hours each", "Top build priority", "Early access to new features"],
  },
};

export const PAID_PLANS = [PLANS.pro, PLANS.max];

type Paid = Exclude<PlanId, "free">;

/**
 * Dodo product ids, one per plan, interval and region. US ids keep their original names:
 * DODO_PRODUCT_PRO_MONTHLY, DODO_PRODUCT_PRO_MONTHLY_IN, DODO_PRODUCT_PRO_MONTHLY_GB, …
 */
export function productIdFor(plan: Paid, interval: Interval, region: Region) {
  const name = `DODO_PRODUCT_${plan.toUpperCase()}_${interval === "month" ? "MONTHLY" : "YEARLY"}${region === "us" ? "" : `_${region.toUpperCase()}`}`;
  return process.env[name] || null;
}

const ALL = (["pro", "max"] as const).flatMap((plan) =>
  (["month", "year"] as const).flatMap((interval) => (["us", "in", "gb"] as const).map((region) => ({ plan, interval, region }))),
);

/** The plan, billing interval and region a Dodo product is, or null for one we don't sell. */
export const productInfo = (productId: string) => ALL.find((p) => productIdFor(p.plan, p.interval, p.region) === productId) ?? null;

/** Which plan a Dodo product is, in any region. */
export const planForProduct = (productId: string): PlanId | null => productInfo(productId)?.plan ?? null;

/** "Pro · monthly" for a Dodo product id, or null for one we don't sell. */
export function productLabel(productId: string) {
  const p = productInfo(productId);
  return p ? `${PLANS[p.plan].name} · ${p.interval === "month" ? "monthly" : "yearly"}` : null;
}
