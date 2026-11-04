import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { DodoError, getInvoicePdf, getPayment } from "@/lib/dodo";

// /api/billing/invoice/<payment id> → that payment's invoice PDF, only for the learner who paid it.
// Dodo's invoice needs our API key, so it goes through here rather than straight to the browser.
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/billing/invoice/[paymentId]">) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Sign in first", { status: 401 });

  const { paymentId } = await ctx.params;
  const [user] = await db.select({ customerId: users.dodoCustomerId }).from(users).where(eq(users.id, userId));
  if (!user?.customerId) return new Response("Not found", { status: 404 });

  try {
    const payment = await getPayment(paymentId);
    if (payment.customer.customer_id !== user.customerId) return new Response("Not found", { status: 404 });
    const pdf = await getInvoicePdf(paymentId);
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="courseit-invoice-${paymentId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof DodoError && (error.status === 404 || error.status === 400)) return new Response("Not found", { status: 404 });
    console.error(error);
    return new Response("Couldn't get that invoice. Try again in a moment.", { status: 502 });
  }
}
