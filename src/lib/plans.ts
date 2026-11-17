// Plans, limits and regional prices: change a number here and the pricing pages, checkout, the limit checks and
// Settings all follow. Plans are measured in hours of video built into new courses. Joining a course someone already
// built is free on every plan and never uses hours, because it costs nothing to serve.
//
// Hours are sized from measured build costs (about $0.094 of AI and captions per hour of video on Pro and Max, $0.059
// on Basic, Nov 2026, with 59% of hours in Hindi). A learner who uses every hour still leaves a profit after tax, all
// of Dodo's fees and building, on every plan and region: in India about ₹73 a month on yearly Pro and ₹223 on yearly
// Max, much more in the US and UK. Yearly is priced to pull people off monthly (US and UK about half price, India
// about a third off Pro); don't push India's yearly prices lower without rechecking that it still covers a heavy user.
export type PlanId = "free" | "basic" | "pro" | "max";
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
  laterPrice?: Record<Region, number>; // the monthly price after the early-user price ends, shown crossed out; make it real when prices go up
  monthlyOnly?: boolean; // sold monthly only: no yearly price or Dodo product (its `year` price is unused)
  launch?: boolean; // the launch offer that stands in for Free until payments are live (LAUNCH_OFFER)
  coursesPerMonth?: number; // a cap on new courses per cycle on top of the hours (launch offer only)
};

/**
 * India: rupees with GST included (what Indian shoppers expect). UK: pounds with VAT included.
 * Everyone else: US dollars, with any sales tax or VAT added at checkout. The note leaves out "USD" to keep the line short.
 */
// `savings`: how the yearly saving is shown. India's yearly discounts differ by plan (33% on Pro, 25% on Max), so
// the amount saved reads better there than a percentage that makes Max look like the worse deal.
export const REGIONS: Record<Region, { currency: string; locale: string; taxNote: string; savings: "amount" | "percent" }> = {
  in: { currency: "INR", locale: "en-IN", taxNote: "incl. GST", savings: "amount" },
  gb: { currency: "GBP", locale: "en-GB", taxNote: "incl. VAT", savings: "percent" },
  us: { currency: "USD", locale: "en-US", taxNote: "plus local taxes", savings: "percent" },
};

/** A visitor's country (ISO code, as Vercel sends it) → the prices they see and pay. */
export const regionFor = (country: string | null | undefined): Region => (country === "IN" ? "in" : country === "GB" ? "gb" : "us");

export const formatPrice = (amount: number, region: Region) =>
  new Intl.NumberFormat(REGIONS[region].locale, {
    style: "currency",
    currency: REGIONS[region].currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

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
  basic: {
    id: "basic",
    name: "Basic",
    tagline: "Build your own courses.",
    price: { in: { month: 199, year: 0 }, gb: { month: 4.99, year: 0 }, us: { month: 4.99, year: 0 } },
    monthlyOnly: true,
    hoursPerMonth: 5,
    maxHours: 5,
    perks: ["Courses up to 5 hours", "Notes, quizzes and placement tests", "Daily plan and roadmaps", "Retry failed builds", "Your courses are shared in Community"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For learning every week.",
    price: { in: { month: 499, year: 3999 }, gb: { month: 15, year: 95 }, us: { month: 19, year: 119 } },
    laterPrice: { in: 799, gb: 24, us: 29 },
    hoursPerMonth: 20,
    maxHours: 10,
    perks: ["Everything in Basic", "Courses up to 10 hours", "Your courses stay private", "Retry failed builds", "Priority course building", "Telegram support"],
  },
  max: {
    id: "max",
    name: "Max",
    tagline: "For whole subjects and bootcamps.",
    price: { in: { month: 999, year: 8999 }, gb: { month: 39, year: 239 }, us: { month: 49, year: 299 } },
    laterPrice: { in: 1599, gb: 59, us: 79 },
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

/**
 * Free is paused: learners without a paid plan can still join and study any built course, but building one needs a
 * plan, and the Free card is hidden. Set this to true to turn Free's 5 hours and its card back on.
 */
export const FREE_BUILDS_OPEN = false;

/** Someone without a paid plan while Free is paused: no hours to build with. */
export const NO_PLAN: Plan = { ...PLANS.free, name: "No plan", hoursPerMonth: 0, maxHours: 0 };

/** True for a plan that can't build at all (see NO_PLAN). */
export const noBuilds = (plan: Plan) => plan.hoursPerMonth === 0;

/**
 * Hours count only courses built from this moment: the day hours-based plans launched. Courses built before it were
 * built under the old "one free course" rules, so everyone starts the new plans with their full hours. Their old
 * courses stay theirs and keep working. Safe to leave in place: after 30 days it no longer changes anything.
 */
export const HOURS_COUNT_FROM = new Date("2026-11-05T00:00:00Z");

/** What a learner without a paid plan gets right now: nothing to build with while Free is paused, or the launch offer before payments are live. */
export const freePlan = () => (!paymentsLive() ? LAUNCH_OFFER : FREE_BUILDS_OPEN ? PLANS.free : NO_PLAN);

const RANK: Record<PlanId, number> = { free: 0, basic: 1, pro: 2, max: 3 };

/** A paying learner moving to a higher plan: a change to their subscription, never a second checkout. */
export const isUpgrade = (from: PlanId, to: PlanId) => RANK[from] > 0 && RANK[to] > RANK[from];

/** The plan to suggest when this one runs out. */
export const nextPlan = (id: PlanId) => (id === "free" ? (FREE_BUILDS_OPEN ? PLANS.pro : PLANS.basic) : id === "basic" ? PLANS.pro : id === "pro" ? PLANS.max : null);

/** Hours as a person reads them: 5 → "5h", 3.33 → "3h 20m", 0.5 → "30m". */
export function formatHours(hours: number) {
  const minutes = Math.max(0, Math.floor(hours * 60));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
}

export const PAID_PLANS = [PLANS.basic, PLANS.pro, PLANS.max];

/** A yearly price as a monthly amount, rounded up so the page never shows less than is charged (₹3,999 → ₹334, $119 → $9.92). */
export const perMonth = (yearly: number, region: Region) => (region === "in" ? Math.ceil(yearly / 12) : Math.ceil((yearly / 12) * 100) / 100);

/** What paying yearly saves over twelve monthly payments: the amount, and the percentage rounded down. */
export function yearlySaving(plan: Plan, region: Region) {
  const { month, year } = plan.price[region];
  const amount = Math.round((month * 12 - year) * 100) / 100;
  return { amount, percent: Math.floor((amount / (month * 12)) * 100) };
}

/**
 * Black Friday 2026: 40% off the first month of monthly Pro and Max, in every region; the second month renews at the
 * usual price. Checkout applies Dodo's discount code `code`, which must exist in Dodo (test and live) as: percentage,
 * amount 4000 (basis points), subscription_cycles 1, restricted to the six monthly Pro and Max products, with the same
 * start and end. Yearly is left out: it's already cheaper than the sale price over a year. Set SALE_PREVIEW=1 locally
 * to see the sale before it starts.
 */
export const SALE = {
  name: "Black Friday",
  code: "BLACKFRIDAY40",
  percent: 40,
  plans: ["pro", "max"] as PlanId[],
  startsAt: new Date("2026-11-27T00:00:00+05:30"),
  endsAt: new Date("2026-12-01T00:00:00+05:30"), // through Cyber Monday, 30 Nov
  endsLabel: "30 Nov",
};

/** Whether the sale is on right now. Reads the clock, so call it only where the page already renders per request. */
export const saleLive = (now = new Date()) =>
  (now >= SALE.startsAt && now < SALE.endsAt) || (process.env.NODE_ENV !== "production" && process.env.SALE_PREVIEW === "1");

/** Whether this plan and billing interval get the sale price. */
export const onSale = (live: boolean, plan: PlanId, interval: Interval) => live && interval === "month" && SALE.plans.includes(plan);

/** The first month's price in the sale: exactly what Dodo charges after the percentage (₹499 → ₹299.40). */
export const salePrice = (amount: number) => Math.round(amount * (100 - SALE.percent)) / 100;

type Paid = Exclude<PlanId, "free">;

/**
 * Dodo product ids, one per plan, interval and region. US ids keep their original names:
 * DODO_PRODUCT_PRO_MONTHLY, DODO_PRODUCT_PRO_MONTHLY_IN, DODO_PRODUCT_PRO_MONTHLY_GB, …
 */
export function productIdFor(plan: Paid, interval: Interval, region: Region) {
  const name = `DODO_PRODUCT_${plan.toUpperCase()}_${interval === "month" ? "MONTHLY" : "YEARLY"}${region === "us" ? "" : `_${region.toUpperCase()}`}`;
  return process.env[name] || null;
}

const ALL = (["basic", "pro", "max"] as const).flatMap((plan) =>
  (PLANS[plan].monthlyOnly ? (["month"] as const) : (["month", "year"] as const)).flatMap((interval) => (["us", "in", "gb"] as const).map((region) => ({ plan, interval, region }))),
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
