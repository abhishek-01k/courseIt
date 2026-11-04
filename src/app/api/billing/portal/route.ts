import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { createPortalLink } from "@/lib/dodo";

// "Manage billing" → Dodo's customer portal: change plan, update the card, cancel, download invoices.
export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [user] = await db.select({ customerId: users.dodoCustomerId }).from(users).where(eq(users.id, userId));
  if (!user?.customerId) redirect("/plans");

  let link: string | null;
  try {
    ({ link } = await createPortalLink(user.customerId, `${request.nextUrl.origin}/settings`));
  } catch (error) {
    console.error(error);
    link = null;
  }
  redirect(link ?? "/settings?error=portal");
}
