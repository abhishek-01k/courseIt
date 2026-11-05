import { createHmac, timingSafeEqual } from "node:crypto";

// Dodo Payments over plain fetch. DODO_PAYMENTS_ENVIRONMENT=live_mode for real money; anything else is test mode.
const base = () => (process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com");

export class DodoError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function dodo<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY ?? ""}`, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) throw new DodoError(`Dodo ${init.method ?? "GET"} ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status);
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

// India and UK products are priced for buyers there (GST or VAT included). Their checkout is locked to that billing
// country and currency: otherwise anyone shown India prices (say through a VPN) could pick a US address and pay ₹499
// converted to dollars, without GST (seen in Nov 2026 tests: $5.29 instead of $19), and the subscription would then
// renew in that other currency. Everyone else pays the US product in dollars, from any country.
const LOCKED: Record<string, { country: string; currency: string }> = { in: { country: "IN", currency: "INR" }, gb: { country: "GB", currency: "GBP" } };

export function createCheckout(input: {
  productId: string;
  region: "in" | "gb" | "us"; // the region of productId (not just of the visitor)
  customer: { customer_id: string } | { email: string; name?: string };
  returnUrl: string;
  cancelUrl: string;
  userId: string;
}) {
  const locked = LOCKED[input.region];
  return dodo<{ session_id: string; checkout_url: string | null }>("/checkouts", {
    method: "POST",
    body: {
      product_cart: [{ product_id: input.productId, quantity: 1 }],
      customer: input.customer,
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      metadata: { user_id: input.userId },
      ...(locked && { billing_address: { country: locked.country }, billing_currency: locked.currency }),
      feature_flags: { allow_currency_selection: false, ...(locked && { allow_customer_editing_country: false }) },
    },
  });
}

export type DodoPayment = {
  payment_id: string;
  total_amount: number; // in the currency's smallest unit, e.g. cents
  currency: string;
  status: string | null; // succeeded, failed, processing, requires_*…
  created_at: string;
  subscription_id: string | null;
  customer: { customer_id: string };
  charge_type?: "new" | "renewal" | "plan_change" | "on_demand" | null;
  refund_status?: "partial" | "full" | null;
  card_last_four?: string | null;
  card_network?: string | null;
};

/** Newest first, as Dodo returns them; 50 covers four years of monthly renewals. */
export const listPayments = (customerId: string) =>
  dodo<{ items: DodoPayment[] }>(`/payments?customer_id=${encodeURIComponent(customerId)}&page_size=50`).then((r) => r.items);

export const getPayment = (id: string) => dodo<DodoPayment>(`/payments/${encodeURIComponent(id)}`);

/** The invoice PDF for one payment. Dodo serves the bytes, not a link. */
export async function getInvoicePdf(paymentId: string) {
  const res = await fetch(`${base()}/invoices/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY ?? ""}` },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Dodo GET invoice ${paymentId} ${res.status}`);
  return res.arrayBuffer();
}

export const getSubscription = (id: string) => dodo<DodoSubscription>(`/subscriptions/${encodeURIComponent(id)}`);

/**
 * Moves a subscription to another product now (Pro → Max). Dodo charges the saved card the prorated difference for the
 * rest of the current period; if that payment fails, nothing changes (the learner stays on their plan).
 */
export const changePlan = (subscriptionId: string, productId: string) =>
  dodo<unknown>(`/subscriptions/${encodeURIComponent(subscriptionId)}/change-plan`, {
    method: "POST",
    body: { product_id: productId, quantity: 1, proration_billing_mode: "prorated_immediately", effective_at: "immediately", on_payment_failure: "prevent_change" },
  });

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
