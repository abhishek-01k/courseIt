import { and, between, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSubscription } from "@/lib/dodo";
import { formatPrice, PLANS, productInfo, REGIONS } from "@/lib/plans";
import { inngest } from "./client";
import { queueEmail } from "./send-email";

const DAY = 24 * 3600 * 1000;

// Once a day: learners whose yearly plan renews in about a week get a heads-up with the amount. Monthly plans
// don't (it would be an email every month). One run checks everyone, so it costs a handful of executions a day.
export const renewalReminders = inngest.createFunction({ id: "renewal-reminders", triggers: [{ cron: "TZ=UTC 0 4 * * *" }] }, async ({ step }) => {
  const due = await step.run("find renewals in 7 days", () =>
    db
      .select({ id: users.id, subscriptionId: users.dodoSubscriptionId, renewsAt: users.planRenewsAt })
      .from(users)
      .where(
        and(
          ne(users.plan, "free"),
          eq(users.planStatus, "active"),
          eq(users.planCancelsAtRenewal, false),
          isNotNull(users.dodoSubscriptionId),
          between(users.planRenewsAt, new Date(Date.now() + 6 * DAY), new Date(Date.now() + 7 * DAY)),
        ),
      ),
  );

  return step.run("queue reminders", async () => {
    let queued = 0;
    for (const u of due) {
      // Our table doesn't keep the billing interval, so ask Dodo which product this is.
      const sub = await getSubscription(u.subscriptionId!).catch(() => null);
      const info = sub && productInfo(sub.product_id);
      if (!info || info.interval !== "year") continue;
      const price = formatPrice(PLANS[info.plan].price[info.region].year, info.region);
      const renewsAt = new Date(sub.next_billing_date).toISOString();
      await queueEmail("renewalReminder", u.id, `renewal:${u.subscriptionId}:${renewsAt.slice(0, 10)}`, {
        plan: PLANS[info.plan].name,
        renewsAt,
        amount: info.region === "us" ? `${price} plus any local tax` : `${price} (${REGIONS[info.region].taxNote})`,
      });
      queued++;
    }
    return `${queued} of ${due.length} reminders queued`;
  });
});
