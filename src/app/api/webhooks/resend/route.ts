import { eq, inArray, sql } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { emailLog, users } from "@/db/schema";

// Resend → here when an email is delivered, bounces or is reported as spam. A hard bounce or a spam report
// stops all email to that address, which keeps CourseIt's sending reputation (and inbox placement) healthy.
// Setup: Resend → Webhooks → https://<domain>/api/webhooks/resend with email.delivered, email.bounced,
// email.complained → copy the signing secret into RESEND_WEBHOOK_SECRET.
export async function POST(request: Request) {
  const payload = await request.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return new Response("Not configured", { status: 503 });

  let event: { type: string; data: { email_id?: string; to?: string[]; bounce?: { type?: string } } };
  try {
    event = new Resend(process.env.RESEND_API_KEY).webhooks.verify({
      payload,
      headers: { id: request.headers.get("svix-id") ?? "", timestamp: request.headers.get("svix-timestamp") ?? "", signature: request.headers.get("svix-signature") ?? "" },
      webhookSecret: secret,
    }) as typeof event;
  } catch {
    return new Response("Bad signature", { status: 401 });
  }

  const { type, data } = event;
  const status = type === "email.delivered" ? "delivered" : type === "email.bounced" ? "bounced" : type === "email.complained" ? "complained" : null;
  if (!status || !data.email_id) return new Response("Ignored");

  await db.update(emailLog).set({ status, updatedAt: new Date() }).where(eq(emailLog.resendId, data.email_id));
  // Soft bounces (a full inbox) pass; a permanent bounce or a spam report stops email to that address.
  const permanent = status === "complained" || (status === "bounced" && data.bounce?.type !== "Transient");
  if (permanent && data.to?.length) {
    await db
      .update(users)
      .set({ emailSuppressedAt: new Date() })
      .where(inArray(sql`lower(${users.email})`, data.to.map((t) => t.toLowerCase())));
  }
  return new Response("OK");
}
