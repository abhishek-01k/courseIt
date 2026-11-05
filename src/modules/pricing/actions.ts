"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { paymentsLive, readUsage, syncSubscription } from "@/lib/billing";
import { changePlan, getSubscription } from "@/lib/dodo";
import { productIdFor, productInfo } from "@/lib/plans";

/**
 * Pro → Max for a learner who's already paying (a second checkout would mean two subscriptions, and Dodo's portal
 * can't change plans). Keeps their billing interval and currency; Dodo charges the prorated difference to the saved
 * card now, and if that fails nothing changes.
 */
export async function upgradeToMaxAction() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  if (!paymentsLive()) redirect("/plans");

  const usage = await readUsage(userId);
  const [user] = await db.select({ subscriptionId: users.dodoSubscriptionId }).from(users).where(eq(users.id, userId));
  if (usage.plan.id !== "pro" || !user?.subscriptionId) redirect("/plans");

  let ok = false;
  try {
    const sub = await getSubscription(user.subscriptionId);
    const info = productInfo(sub.product_id);
    const target = info && productIdFor("max", info.interval, info.region);
    if (sub.status === "active" && info?.plan === "pro" && target) {
      await changePlan(sub.subscription_id, target);
      // Dodo applies the change once the prorated payment goes through, a second or two later (seen in tests). Wait
      // briefly so Settings already shows Max; if it takes longer, the subscription webhook brings it in.
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        if ((await getSubscription(sub.subscription_id)).product_id === target) break;
      }
      await syncSubscription(sub.subscription_id, userId);
      ok = true;
    }
  } catch (error) {
    console.error("[billing] upgrade to Max failed", error);
  }
  redirect(ok ? "/settings?upgraded=1" : "/plans?error=upgrade");
}
