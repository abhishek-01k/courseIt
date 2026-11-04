import { createHmac, timingSafeEqual } from "node:crypto";

// Dodo Payments over plain fetch. DODO_PAYMENTS_ENVIRONMENT=live_mode for real money; anything else is test mode.
const base = () => (process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com");

async function dodo<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY ?? ""}`, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Dodo ${init.method ?? "GET"} ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

export type DodoSubscription = {
  subscription_id: string;
  product_id: string;
  status: "pending" | "active" | "on_hold" | "paused" | "cancelled" | "failed" | "expired" | "past_due";
  customer: { customer_id: string; email: string; name: string };
  metadata: Record<string, unknown> | null;
  next_billing_date: string; // end of the current paid period
  cancel_at_next_billing_date: boolean;
};

export function createCheckout(input: {
  productId: string;
  customer: { customer_id: string } | { email: string; name?: string };
  returnUrl: string;
  cancelUrl: string;
  userId: string;
}) {
  return dodo<{ session_id: string; checkout_url: string | null }>("/checkouts", {
    method: "POST",
    body: {
      product_cart: [{ product_id: input.productId, quantity: 1 }],
      customer: input.customer,
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      metadata: { user_id: input.userId },
    },
  });
}

export const getSubscription = (id: string) => dodo<DodoSubscription>(`/subscriptions/${encodeURIComponent(id)}`);

export const createPortalLink = (customerId: string, returnUrl: string) =>
  dodo<{ link: string }>(`/customers/${encodeURIComponent(customerId)}/customer-portal/session?return_url=${encodeURIComponent(returnUrl)}`, { method: "POST" });

/**
 * Standard Webhooks check: HMAC-SHA256 of "id.timestamp.body" with the base64 secret (minus "whsec_"),
 * compared against every "v1,<sig>" in the header, and the timestamp within 5 minutes.
 */
export function verifyWebhook(body: string, headers: Headers) {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatures = headers.get("webhook-signature");
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!id || !timestamp || !signatures || !secret) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 5 * 60) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signatures.split(" ").some((entry) => {
    const [version, sig] = entry.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
