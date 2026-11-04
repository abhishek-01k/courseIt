import { and, count, eq, gte, type SQL, sql, sum } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { courses, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { getSubscription } from "@/lib/dodo";
import { queueEmail } from "@/inngest/send-email";
import { PLANS, type Plan, planForProduct } from "@/lib/plans";

// Paid access while the subscription is active or retrying a payment; after a cancel, until the paid
// period ends. on_hold, failed, expired, paused: back to Free.
type Billing = Pick<typeof users.$inferSelect, "plan" | "planStatus" | "planRenewsAt">;

function hasPaidAccess(u: Billing) {
  if (u.plan === "free") return false;
  if (u.planStatus === "active" || u.planStatus === "past_due") return true;
  return u.planStatus === "cancelled" && !!u.planRenewsAt && u.planRenewsAt > new Date();
}

const MONTH_MS = 30 * 24 * 3600 * 1000;

export type Usage = {
  plan: Plan;
  used: number; // new courses built in the last 30 days (on Free: ever)
  left: number;
  hoursUsed: number; // video hours of those courses
  hoursLeft: number;
  unlimited: boolean; // admins
  renewsAt: Date | null;
  cancelsAtRenewal: boolean;
  status: string | null;
  canManage: boolean; // has a Dodo customer, so the billing portal opens
};

// cache: the sidebar, the build form and the page often ask in the same request; one lookup serves them all.
export const usageFor = cache(async (userId: string): Promise<Usage> => {
  const [u] = await db
    .select({
      email: users.email,
      plan: users.plan,
      planStatus: users.planStatus,
      planRenewsAt: users.planRenewsAt,
      planCancelsAtRenewal: users.planCancelsAtRenewal,
      dodoCustomerId: users.dodoCustomerId,
    })
    .from(users)
    .where(eq(users.id, userId));
  const plan = u && hasPaidAccess(u) ? PLANS[u.plan] : PLANS.free;
  const [{ used, seconds }] = await db
    .select({ used: count(), seconds: sum(courses.durationSeconds).mapWith(Number) })
    .from(courses)
    // Free's one course is once per account, so anyone who has built a course (even one that failed, or
    // back when they were paying) needs Pro or Max to build another. Paid plans count a rolling 30 days.
    .where(and(eq(courses.createdBy, userId), plan.lifetime ? undefined : gte(courses.createdAt, new Date(Date.now() - MONTH_MS))));
  const unlimited = isAdmin(u?.email);
  return {
    plan,
    used,
    left: unlimited ? Infinity : Math.max(0, plan.coursesPerMonth - used),
    hoursUsed: Math.round(((seconds ?? 0) / 3600) * 10) / 10,
    hoursLeft: unlimited ? Infinity : Math.max(0, plan.hoursPerMonth - (seconds ?? 0) / 3600),
    unlimited,
    renewsAt: plan.id === "free" ? null : (u?.planRenewsAt ?? null),
    cancelsAtRenewal: plan.id !== "free" && !!u?.planCancelsAtRenewal,
    status: u?.planStatus ?? null,
    canManage: !!u?.dodoCustomerId,
  };
});

/**
 * Why this learner can't build a new course right now, or null when they can. Used to lock the build form
 * and fill the sidebar counter, so nobody pastes a link only to be told no.
 */
export function buildBlock(u: Usage): { title: string; detail: string; upgrade: boolean } | null {
  if (u.unlimited) return null;
  const { plan } = u;
  if (u.left <= 0) {
    return plan.lifetime
      ? { title: "You've used your free course", detail: "Upgrade to build your own courses, or join one someone already built.", upgrade: true }
      : {
          title: `You've built all ${plan.coursesPerMonth} courses for this month`,
          detail: `A slot frees up 30 days after each build.${plan.id === "pro" ? " Max gives you 20 a month." : ""}`,
          upgrade: plan.id !== "max",
        };
  }
  if (u.hoursLeft < 0.1) {
    return {
      title: `You've used all ${plan.hoursPerMonth} hours of video ${plan.lifetime ? "on Free" : "for this month"}`,
      detail: `Hours free up 30 days after each build.${plan.id === "pro" ? " Max gives you 100 hours a month." : ""}`,
      upgrade: plan.id !== "max",
    };
  }
  return null;
}

/** On Pro or Max (admins count too). Paid perks: retrying failed builds, chat support. */
export const isPaid = (u: Usage) => u.unlimited || u.plan.id !== "free";

/** Retrying a failed build is a Pro and Max feature. A failed build still counts toward Free's limit. */
export const canRetry = isPaid;

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
    await queueEmail("planStarted", user.id, `plan-started:${id}:${plan}`, { plan: name, courses: PLANS[plan].coursesPerMonth, hours: PLANS[plan].hoursPerMonth });
  }
  if ((sub.status === "on_hold" || sub.status === "past_due") && was?.planStatus !== sub.status) {
    await queueEmail("paymentFailed", user.id, `payment-failed:${id}:${sub.next_billing_date.slice(0, 10)}`, { plan: name });
  }
  if ((sub.cancel_at_next_billing_date && !was?.cancels) || (sub.status === "cancelled" && was?.planStatus !== "cancelled")) {
    await queueEmail("planEnding", user.id, `plan-ending:${id}`, { plan: name, endsAt: new Date(sub.next_billing_date).toISOString() });
  }
  return true;
}
