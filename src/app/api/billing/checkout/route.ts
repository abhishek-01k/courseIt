import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { usageFor } from "@/lib/billing";
import { createCheckout } from "@/lib/dodo";
import { type Interval, type PlanId, productIdFor } from "@/lib/plans";
import { currentRegion } from "@/lib/region";

// /api/billing/checkout?plan=pro&interval=month → Dodo's checkout page. Learners already paying change
// plans in the billing portal instead, so nobody ends up with two subscriptions.
export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const plan = request.nextUrl.searchParams.get("plan") as PlanId;
  const interval = (request.nextUrl.searchParams.get("interval") === "year" ? "year" : "month") as Interval;
  // Same region as the prices the learner was shown. A region without its products set falls back to US prices.
  const region = await currentRegion();
  const productId = plan === "pro" || plan === "max" ? (productIdFor(plan, interval, region) ?? productIdFor(plan, interval, "us")) : null;
  if (!productId) redirect("/plans");

  const usage = await usageFor(userId);
  if (usage.plan.id !== "free" && usage.canManage) redirect("/api/billing/portal");

  const [user] = await db.select({ email: users.email, name: users.name, dodoCustomerId: users.dodoCustomerId }).from(users).where(eq(users.id, userId));
  const origin = request.nextUrl.origin;
  let url: string | null;
  try {
    ({ checkout_url: url } = await createCheckout({
      productId,
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
