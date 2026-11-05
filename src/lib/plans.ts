// Plans, limits and regional prices: change a number here and the pricing pages, checkout, the limit checks and
// Settings all follow. Plans are measured in hours of video built into new courses. Joining a course someone already
// built is free on every plan and never uses hours, because it costs nothing to serve.
//
// Hours are sized from measured build costs (about $0.085 of AI, captions and search per hour of video, Nov 2026), so
// a learner who uses every hour still leaves more than half of the plan's price after tax and fees, in every region.
export type PlanId = "free" | "pro" | "max";
export type Interval = "month" | "year";
export type Region = "in" | "gb" | "us";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  price: Record<Region, Record<Interval, number>>; // in each region's currency; yearly is charged once a year
  hoursPerMonth: number; // hours of video built into new courses each month (Free: renews on the sign-up day)
  maxHours: number; // longest video or playlist one course can be built from
  perks: string[];
  launch?: boolean; // the launch offer that stands in for Free until payments are live (LAUNCH_OFFER)
  coursesPerMonth?: number; // a cap on new courses per cycle on top of the hours (launch offer only)
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

// Keep taglines to one short line so every card's price sits at the same height, and perks to a few words.
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Try it out, no card needed.",
    price: { in: { month: 0, year: 0 }, gb: { month: 0, year: 0 }, us: { month: 0, year: 0 } },
    hoursPerMonth: 5,
    maxHours: 5,
    perks: ["Join any built course, free", "Courses up to 5 hours", "Notes, quizzes and placement tests", "Daily plan and roadmaps"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For learning every week.",
    price: { in: { month: 499, year: 4999 }, gb: { month: 15, year: 149 }, us: { month: 19, year: 189 } },
    hoursPerMonth: 20,
    maxHours: 10,
    perks: ["Everything in Free", "Courses up to 10 hours", "Your courses stay private", "Retry failed builds", "Priority course building", "Telegram support"],
  },
  max: {
    id: "max",
    name: "Max",
    tagline: "For whole subjects and bootcamps.",
    price: { in: { month: 999, year: 9999 }, gb: { month: 39, year: 389 }, us: { month: 49, year: 489 } },
    hoursPerMonth: 40,
    maxHours: 20,
    perks: ["Everything in Pro", "Courses up to 20 hours", "Highest priority building", "WhatsApp support", "Priority support", "Early access to new features"],
  },
};

/**
 * Whether learners can pay. Off until Dodo approves the business and DODO_PAYMENTS_ENVIRONMENT=live_mode is set:
 * paid plans show "Coming soon" and checkout is closed. Set DODO_ALLOW_TEST_CHECKOUT=1 locally to try test-mode
 * checkout; never in production, where it would let anyone get a paid plan with a test card.
 */
export const paymentsLive = () =>
  process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" || (process.env.NODE_ENV !== "production" && process.env.DODO_ALLOW_TEST_CHECKOUT === "1");

/**
 * Launch offer: until payments are live, nobody can upgrade, so a learner without a paid plan gets ONE new course a
 * month, of up to 10 hours (a video, or a playlist adding up to 10 hours at most), renewing on the sign-up day like
 * Free. It switches to the normal plans by itself the moment payments go live.
 */
export const LAUNCH_OFFER: Plan = {
  ...PLANS.free,
  hoursPerMonth: 10,
  maxHours: 10,
  coursesPerMonth: 1,
  launch: true,
  perks: PLANS.free.perks.map((p) => (p === "Courses up to 5 hours" ? "One course up to 10 hours" : p)),
};

/** What a learner without a paid plan gets right now: Free, or the launch offer before payments are live. */
export const freePlan = () => (paymentsLive() ? PLANS.free : LAUNCH_OFFER);

/** Hours as a person reads them: 5 → "5h", 3.33 → "3h 20m", 0.5 → "30m". */
export function formatHours(hours: number) {
  const minutes = Math.max(0, Math.floor(hours * 60));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
}

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
