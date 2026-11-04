import { syncSubscription } from "@/lib/billing";
import { verifyWebhook } from "@/lib/dodo";

// Dodo Payments → here on every subscription change (active, renewed, plan_changed, on_hold, cancelled, expired…).
// Each one re-reads the subscription from Dodo, so events arriving late or out of order still end right.
// A 500 makes Dodo retry (up to 8 times); anything we choose to ignore gets a 200.
export async function POST(request: Request) {
  const body = await request.text();
  if (!verifyWebhook(body, request.headers)) return new Response("Bad signature", { status: 401 });

  const event = JSON.parse(body) as { type?: string; data?: { subscription_id?: unknown } };
  const subscriptionId = event.data?.subscription_id;
  if (!event.type?.startsWith("subscription.") || typeof subscriptionId !== "string") return new Response("Ignored");

  try {
    await syncSubscription(subscriptionId);
  } catch (error) {
    console.error(`[billing] webhook ${event.type} for ${subscriptionId} failed`, error);
    return new Response("Retry later", { status: 500 });
  }
  return new Response("OK");
}
