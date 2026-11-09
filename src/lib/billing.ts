import { and, count, eq, gte, min, ne, or, type SQL, sql, sum } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { courses, lessons, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { getSubscription } from "@/lib/dodo";
import { queueEmail } from "@/inngest/send-email";
import { freePlan, HOURS_COUNT_FROM, nextPlan, noBuilds, PLANS, paymentsLive, type Plan, planForProduct } from "@/lib/plans";

// Paid access while the subscription is active or retrying a payment; after a cancel, until the paid
// period ends. on_hold, failed, expired, paused: back to Free.
type Billing = Pick<typeof users.$inferSelect, "plan" | "planStatus" | "planRenewsAt">;

function hasPaidAccess(u: Billing) {
  if (u.plan === "free") return false;
  if (u.planStatus === "active" || u.planStatus === "past_due") return true;
  return u.planStatus === "cancelled" && !!u.planRenewsAt && u.planRenewsAt > new Date();
}

const MONTH_MS = 30 * 24 * 3600 * 1000;

/**
 * The start of the current monthly cycle for someone who signed up on `anchor`: the latest date on or before `now` that
 * falls on the sign-up day of the month (the 31st becomes the last day of shorter months). Also returns the next one.
 */
export function monthlyCycle(anchor: Date, now = new Date()) {
  const on = (year: number, month: number) => {
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(anchor.getUTCDate(), last), anchor.getUTCHours(), anchor.getUTCMinutes()));
  };
  let start = on(now.getUTCFullYear(), now.getUTCMonth());
  if (start > now) start = on(now.getUTCFullYear(), now.getUTCMonth() - 1);
  return { start, next: on(start.getUTCFullYear(), start.getUTCMonth() + 1) };
}

export { paymentsLive } from "@/lib/plans";

export type Usage = {
  plan: Plan;
  hoursUsed: number; // video hours built this cycle (Free: since the sign-up day this month; paid: the last 30 days)
  hoursLeft: number;
  hoursBackAt: Date | null; // when hours come back: Free's next renewal, or when the oldest paid build turns 30 days
  coursesUsed: number; // new courses counted this cycle (same rules as the hours)
  coursesLeft: number; // Infinity unless the plan caps courses (the launch offer: 1 a month)
  unlimited: boolean; // no build limits: admins only
  admin: boolean;
  renewsAt: Date | null;
  cancelsAtRenewal: boolean;
  status: string | null;
  canManage: boolean; // has a Dodo customer, so the billing portal opens
};

/**
 * The learner's plan and hours, read fresh. Most callers want usageFor (cached per request).
 * `upTo`: count only courses started no later than this course (itself included). Used by the re-check after saving a
 * course, so when two builds start at once only the later one goes over and is backed out, never both.
 */
export async function readUsage(userId: string, upTo?: string): Promise<Usage> {
  const [u] = await db
    .select({
      email: users.email,
      plan: users.plan,
      planStatus: users.planStatus,
      planRenewsAt: users.planRenewsAt,
      planCancelsAtRenewal: users.planCancelsAtRenewal,
      dodoCustomerId: users.dodoCustomerId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));
  // Free, or the launch offer while payments aren't live yet (src/lib/plans.ts).
  const plan = u && hasPaidAccess(u) ? PLANS[u.plan] : freePlan();
  // Free: hours renew each month on the sign-up day, and unused ones don't carry over. Paid: a rolling 30 days, so
  // each build's hours come back 30 days after it. Hours used on Free still count after an upgrade, and the other way.
  const cycle = plan.id === "free" ? monthlyCycle(u?.createdAt ?? new Date()) : null;
  const cycleStart = cycle?.start ?? new Date(Date.now() - MONTH_MS);
  // Builds from before the hours-based plans launched don't count (see HOURS_COUNT_FROM).
  const since = cycleStart > HOURS_COUNT_FROM ? cycleStart : HOURS_COUNT_FROM;
  // A failed build counts only the lessons it finished (often none), so a build that breaks doesn't eat the
  // learner's hours. Everything else (queued, building, ready) counts in full from the moment it starts.
  const builtSeconds = sql<number>`case when ${courses.status} <> 'failed' then ${courses.durationSeconds}
    else coalesce((select sum(${lessons.endSeconds} - ${lessons.startSeconds}) from ${lessons} where ${lessons.courseId} = ${courses.id} and ${lessons.ready}), 0) end`;
  const [{ seconds, oldest, built }] = await db
    .select({ seconds: sum(builtSeconds).mapWith(Number), oldest: min(courses.createdAt), built: count() })
    .from(courses)
    .where(
      and(
        eq(courses.createdBy, userId),
        gte(courses.createdAt, since),
        or(ne(courses.status, "failed"), sql`exists (select 1 from ${lessons} where ${lessons.courseId} = ${courses.id} and ${lessons.ready})`),
        upTo ? sql`(${courses.createdAt}, ${courses.id}) <= (select c.created_at, c.id from course c where c.id = ${upTo})` : undefined,
      ),
    );
  const hours = (seconds ?? 0) / 3600;
  const admin = isAdmin(u?.email);
  const unlimited = admin;
  return {
    plan,
    hoursUsed: Math.round(hours * 10) / 10,
    hoursLeft: unlimited ? Infinity : Math.max(0, plan.hoursPerMonth - hours),
    hoursBackAt: cycle ? cycle.next : oldest ? new Date(new Date(oldest).getTime() + MONTH_MS) : null,
    coursesUsed: built,
    coursesLeft: unlimited || !plan.coursesPerMonth ? Infinity : Math.max(0, plan.coursesPerMonth - built),
    unlimited,
    admin,
    renewsAt: plan.id === "free" ? null : (u?.planRenewsAt ?? null),
    cancelsAtRenewal: plan.id !== "free" && !!u?.planCancelsAtRenewal,
    status: u?.planStatus ?? null,
    canManage: !!u?.dodoCustomerId,
  };
}

// cache: the sidebar, the build form and the page often ask in the same request; one lookup serves them all.
export const usageFor = cache(readUsage);

/** "12 Dec": when hours come back, for messages. */
export const shortDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * Why this learner can't build a new course right now, or null when they can. Used to lock the build form
 * and fill the sidebar counter, so nobody pastes a link only to be told no.
 */
export function buildBlock(u: Usage): { title: string; detail: string; upgrade: boolean } | null {
  if (u.unlimited) return null;
  const { plan } = u;
  // Free is paused (FREE_BUILDS_OPEN): joining stays free, building needs a plan.
  if (noBuilds(plan)) return { title: "Building new courses needs a plan", detail: "Browse courses other learners have built. They're free to join.", upgrade: true };
  const back = u.hoursBackAt ? shortDate(u.hoursBackAt) : null;
  // Launch offer: one course a month, whatever its length.
  if (u.coursesLeft <= 0) {
    return {
      title: "You've built your free course for this month",
      detail: [back && `You can build another on ${back}.`, "Courses others built are always free to join.", "Pro and Max are coming soon."].filter(Boolean).join(" "),
      upgrade: false,
    };
  }
  if (u.hoursLeft >= 1 / 60) return null;
  // Nobody can upgrade until payments are live, so no upgrade is offered then.
  const next = !paymentsLive() ? null : nextPlan(plan.id);
  return {
    title: plan.launch
      ? `You've used your ${plan.hoursPerMonth} launch hours this month`
      : `You've used all ${plan.hoursPerMonth} hours ${plan.id === "free" ? "of Free" : `of ${plan.name}`} this month`,
    detail: [
      back && (plan.id === "free" ? `Your free hours renew on ${back}.` : `Hours start coming back on ${back}.`),
      next && `${next.name} gives you ${next.hoursPerMonth} hours a month.`,
      plan.launch && "Pro and Max are coming soon.",
    ]
      .filter(Boolean)
      .join(" "),
    upgrade: !!next,
  };
}

/** On any paid plan (admins count too). */
export const isPaid = (u: Usage) => u.admin || u.plan.id !== "free";

/** On Pro or Max (admins count too): private courses and chat support. Basic courses are public, like Free's were. */
export const hasProPerks = (u: Usage) => u.admin || u.plan.id === "pro" || u.plan.id === "max";

/** Retrying a failed build comes with every paid plan (and for everyone while payments aren't live). */
export const canRetry = (u: Usage) => isPaid(u) || !paymentsLive();

/** Sent with every build so Inngest runs paid builds first when the queue is busy (see build-course.ts). */
export const buildPriority = (u: Usage) => (u.unlimited ? "max" : u.plan.id);

/**
 * Reads a subscription from Dodo (never trusting the webhook body's shape) and saves it on its learner.
 * The learner is found by: whoever already holds it, the user_id sent at checkout, the signed-in learner
 * coming back from checkout, the saved Dodo customer, then the email. Returns false when it isn't ours to apply.
 */
export async function syncSubscription(subscriptionId: string, signedInUserId?: string) {
  const sub = await getSubscription(subscriptionId);
  const plan = planForProduct(sub.product_id);
  if (!plan) {
    console.error(`[billing] subscription ${sub.subscription_id} is for unknown product ${sub.product_id}`);
    return false;
  }

  const metaUser = typeof sub.metadata?.user_id === "string" ? sub.metadata.user_id : undefined;
  const find = async (where: SQL | undefined) =>
    (
      await db
        .select({ id: users.id, dodoSubscriptionId: users.dodoSubscriptionId, plan: users.plan, planStatus: users.planStatus, cancels: users.planCancelsAtRenewal })
        .from(users)
        .where(where)
        .limit(1)
    )[0];
  // The signed-in learner only claims a subscription nobody else holds (ids reach just the payer's browser).
  const owner = await find(eq(users.dodoSubscriptionId, sub.subscription_id));
  const user =
    owner ||
    (metaUser && (await find(eq(users.id, metaUser)))) ||
    (signedInUserId && (await find(eq(users.id, signedInUserId)))) ||
    (await find(eq(users.dodoCustomerId, sub.customer.customer_id))) ||
    (await find(sql`lower(${users.email}) = lower(${sub.customer.email})`));
  if (!user) {
    console.error(`[billing] no learner for subscription ${sub.subscription_id} (${sub.customer.email})`);
    return false;
  }

  // An old subscription ending (say after switching plans) must not undo the new one.
  if (user.dodoSubscriptionId && user.dodoSubscriptionId !== sub.subscription_id && sub.status !== "active") return false;

  await db
    .update(users)
    .set({
      plan,
      planStatus: sub.status,
      planRenewsAt: new Date(sub.next_billing_date),
      planCancelsAtRenewal: sub.cancel_at_next_billing_date,
      dodoCustomerId: sub.customer.customer_id,
      dodoSubscriptionId: sub.subscription_id,
    })
    .where(eq(users.id, user.id));

  // Emails only on a real change, so the return page and the webhook (or a webhook retried) never send twice;
  // each key also makes sure of that (src/inngest/send-email.ts).
  const name = PLANS[plan].name;
  const id = sub.subscription_id;
  const was = user.dodoSubscriptionId === id ? user : null; // what we knew about this subscription before
  if (sub.status === "active" && (was?.planStatus !== "active" || was.plan !== plan)) {
    await queueEmail("planStarted", user.id, `plan-started:${id}:${plan}`, { plan: name, hours: PLANS[plan].hoursPerMonth, maxHours: PLANS[plan].maxHours });
  }
  if ((sub.status === "on_hold" || sub.status === "past_due") && was?.planStatus !== sub.status) {
    await queueEmail("paymentFailed", user.id, `payment-failed:${id}:${sub.next_billing_date.slice(0, 10)}`, { plan: name });
  }
  if ((sub.cancel_at_next_billing_date && !was?.cancels) || (sub.status === "cancelled" && was?.planStatus !== "cancelled")) {
    await queueEmail("planEnding", user.id, `plan-ending:${id}`, { plan: name, endsAt: new Date(sub.next_billing_date).toISOString() });
  }
  return true;
}
