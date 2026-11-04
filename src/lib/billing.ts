import { and, count, eq, gte, type SQL, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses, users } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { getSubscription } from "@/lib/dodo";
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
  used: number; // new courses built in the last 30 days
  left: number;
  unlimited: boolean; // admins
  renewsAt: Date | null;
  cancelsAtRenewal: boolean;
  status: string | null;
  canManage: boolean; // has a Dodo customer, so the billing portal opens
};

export async function usageFor(userId: string): Promise<Usage> {
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
  const [{ used }] = await db
    .select({ used: count() })
    .from(courses)
    .where(and(eq(courses.createdBy, userId), gte(courses.createdAt, new Date(Date.now() - MONTH_MS))));
  const unlimited = isAdmin(u?.email);
  return {
    plan,
    used,
    left: unlimited ? Infinity : Math.max(0, plan.coursesPerMonth - used),
    unlimited,
    renewsAt: plan.id === "free" ? null : (u?.planRenewsAt ?? null),
    cancelsAtRenewal: plan.id !== "free" && !!u?.planCancelsAtRenewal,
    status: u?.planStatus ?? null,
    canManage: !!u?.dodoCustomerId,
  };
}

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
    (await db.select({ id: users.id, dodoSubscriptionId: users.dodoSubscriptionId }).from(users).where(where).limit(1))[0];
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
  return true;
}
