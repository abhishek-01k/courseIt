import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { paymentsLive, usageFor } from "@/lib/billing";
import { createCheckout } from "@/lib/dodo";
import { type Interval, isUpgrade, PLANS, type PlanId, productIdFor } from "@/lib/plans";
import { currentRegion } from "@/lib/region";

// /api/billing/checkout?plan=pro&interval=month → Dodo's checkout page. Learners already paying change
// plans in the billing portal instead, so nobody ends up with two subscriptions.
export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  // Closed until live payments are switched on, so a test-mode key in production can't hand out free plans.
  if (!paymentsLive()) redirect("/plans?error=soon");

  const plan = request.nextUrl.searchParams.get("plan") as PlanId;
  const interval = (request.nextUrl.searchParams.get("interval") === "year" && !PLANS[plan]?.monthlyOnly ? "year" : "month") as Interval;
  // Same region as the prices the learner was shown. A region without its products set falls back to US prices.
  const visitor = await currentRegion();
  const paid = plan === "basic" || plan === "pro" || plan === "max";
  const region = paid && productIdFor(plan, interval, visitor) ? visitor : "us";
  const productId = paid ? productIdFor(plan, interval, region) : null;
  if (!productId) redirect("/plans");

  const usage = await usageFor(userId);
  // Already paying: moving up is a plan change (confirmed on /plans), anything else is managed in Dodo's portal.
  if (isUpgrade(usage.plan.id, plan) && usage.canManage) redirect(`/plans?upgrade=${plan}`);
  if (usage.plan.id !== "free" && usage.canManage) redirect("/api/billing/portal");

  const [user] = await db.select({ email: users.email, name: users.name, dodoCustomerId: users.dodoCustomerId }).from(users).where(eq(users.id, userId));
  const origin = request.nextUrl.origin;
  let url: string | null;
  try {
    ({ checkout_url: url } = await createCheckout({
      productId,
      region,
      customer: user?.dodoCustomerId ? { customer_id: user.dodoCustomerId } : { email: user?.email ?? "", name: user?.name ?? undefined },
      returnUrl: `${origin}/api/billing/return`,
      cancelUrl: `${origin}/plans`,
      userId,
    }));
  } catch (error) {
    console.error(error);
    url = null;
  }
  redirect(url ?? "/plans?error=checkout");
}
