import { eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { type DodoPayment, getSubscription, listPayments } from "@/lib/dodo";
import { productLabel } from "@/lib/plans";
import { cn } from "@/lib/utils";

const date = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// Dodo amounts are in the currency's smallest unit; Intl knows how many decimals each currency has.
function money(amount: number, currency: string) {
  const format = new Intl.NumberFormat("en-US", { style: "currency", currency });
  return format.format(amount / 10 ** (format.resolvedOptions().maximumFractionDigits ?? 2));
}

const CHARGE: Record<string, string> = { new: "Subscribed", renewal: "Renewal", plan_change: "Plan change", on_demand: "Charge" };

function statusOf(p: DodoPayment): { label: string; tone: "ok" | "bad" | "muted" } {
  if (p.refund_status === "full") return { label: "Refunded", tone: "muted" };
  if (p.refund_status === "partial") return { label: "Part refunded", tone: "muted" };
  if (p.status === "succeeded") return { label: "Paid", tone: "ok" };
  if (p.status === "failed" || p.status === "cancelled") return { label: "Failed", tone: "bad" };
  return { label: "Pending", tone: "muted" };
}

// Settings → Billing history: every payment, read live from Dodo (we don't keep a copy), with its invoice.
export default async function BillingHistory() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const [user] = await db.select({ customerId: users.dodoCustomerId }).from(users).where(eq(users.id, userId));
  if (!user?.customerId) return <p className="text-[0.92rem] text-ink-soft">No payments yet. Your invoices show here once you upgrade.</p>;

  let payments: DodoPayment[];
  try {
    payments = await listPayments(user.customerId);
  } catch (error) {
    console.error(error);
    return <p className="text-[0.92rem] text-ink-soft">We couldn&apos;t load your billing history right now. Try again in a moment.</p>;
  }
  if (payments.length === 0) return <p className="text-[0.92rem] text-ink-soft">No payments yet.</p>;

  // The payment list doesn't say which product it was for, so look up each subscription once (usually one or two).
  const subIds = [...new Set(payments.map((p) => p.subscription_id).filter((id): id is string => !!id))];
  const plans = new Map(
    await Promise.all(
      subIds.map(async (id) => [id, await getSubscription(id).then((s) => productLabel(s.product_id), () => null)] as const),
    ),
  );

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-[0_0_0_1px_var(--line)]">
      {payments.map((p) => {
        const status = statusOf(p);
        const plan = (p.subscription_id && plans.get(p.subscription_id)) || "CourseIt";
        const card = p.card_last_four ? `${p.card_network ? `${p.card_network[0].toUpperCase()}${p.card_network.slice(1)} ` : ""}•••• ${p.card_last_four}` : null;
        return (
          <li key={p.payment_id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-medium">
                {plan}
                {p.charge_type && <span className="font-normal text-ink-soft"> · {CHARGE[p.charge_type] ?? "Charge"}</span>}
              </span>
              <span className="text-[0.85rem] text-ink-soft">
                {date(p.created_at)}
                {card && ` · ${card}`}
              </span>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[0.78rem] font-medium",
                status.tone === "ok" && "bg-lime-soft text-moss",
                status.tone === "bad" && "bg-destructive/10 text-destructive",
                status.tone === "muted" && "bg-ink/5 text-ink-soft",
              )}
            >
              {status.label}
            </span>
            <span className="w-20 text-right font-medium tabular-nums">{money(p.total_amount, p.currency)}</span>
            {p.status === "succeeded" ? (
              <a
                href={`/api/billing/invoice/${encodeURIComponent(p.payment_id)}`}
                aria-label={`Download invoice for ${date(p.created_at)}`}
                className="flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-lime-soft hover:text-pill-ink"
              >
                <Download aria-hidden="true" className="size-4" />
              </a>
            ) : (
              <span aria-hidden="true" className="size-9" />
            )}
          </li>
        );
      })}
    </ul>
  );
}
