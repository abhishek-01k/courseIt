import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { emailLog, users } from "@/db/schema";
import { type Template, TEMPLATES, type TemplateProps } from "@/emails/templates";
import { inngest, SEND_EMAIL } from "./client";

type SendEmailData = { template: Template; userId: string; key: string; props: Record<string, unknown> };

/**
 * Queues one email to a learner. `key` names this exact email ("course-ready:<course id>"): it is sent at most
 * once, however often this is called. Never throws, so a mail problem can't break sign-in, billing or a build.
 */
export async function queueEmail<T extends Template>(template: T, userId: string, key: string, props: Omit<TemplateProps<T>, "name">) {
  try {
    await inngest.send({ name: SEND_EMAIL, id: key, data: { template, userId, key, props } satisfies SendEmailData });
  } catch (error) {
    console.error(`[email] couldn't queue ${key}`, error);
  }
}

// Every email goes out through here: retried if Resend is down, throttled under Resend's rate limit, logged in
// email_log, and skipped for learners with no email address or one that bounced (see the Resend webhook).
export const sendEmail = inngest.createFunction(
  { id: "send-email", triggers: [{ event: SEND_EMAIL }], retries: 5, throttle: { limit: 2, period: "1s" } },
  async ({ event, step }) => {
    const { template, userId, key, props } = event.data as SendEmailData;

    return step.run("send", async () => {
      const [done] = await db.select({ status: emailLog.status }).from(emailLog).where(eq(emailLog.key, key));
      if (done && done.status !== "sending" && done.status !== "failed") return `already ${done.status}`;

      const [user] = await db.select({ email: users.email, name: users.name, suppressed: users.emailSuppressedAt }).from(users).where(eq(users.id, userId));
      const skip = !user ? "no such learner" : !user.email ? "no email address" : user.suppressed ? "address bounced or reported spam" : null;
      const row = { key, userId: user ? userId : null, template, to: user?.email ?? null, updatedAt: new Date() };
      if (skip) {
        await db.insert(emailLog).values({ ...row, status: "skipped", detail: skip }).onConflictDoUpdate({ target: emailLog.key, set: { status: "skipped", detail: skip, updatedAt: new Date() } });
        return `skipped: ${skip}`;
      }
      await db.insert(emailLog).values({ ...row, status: "sending" }).onConflictDoUpdate({ target: emailLog.key, set: { status: "sending", detail: null, updatedAt: new Date() } });

      const build = TEMPLATES[template] as (p: Record<string, unknown>) => { subject: string; body: React.ReactElement };
      const { subject, body } = build({ ...props, name: user!.name });
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send(
        {
          from: process.env.EMAIL_FROM ?? "CourseIt <hello@mail.courseit.xyz>",
          replyTo: process.env.EMAIL_REPLY_TO ?? "hello@triggerfy.xyz",
          to: user!.email!,
          subject,
          react: body,
          tags: [{ name: "template", value: template }],
        },
        { idempotencyKey: key.slice(0, 256) }, // Resend drops a repeat of the same key, even if our log write failed
      );
      if (error) {
        await db.update(emailLog).set({ status: "failed", detail: `${error.name}: ${error.message}`.slice(0, 500), updatedAt: new Date() }).where(eq(emailLog.key, key));
        throw new Error(`Resend ${error.name}: ${error.message}`); // Inngest retries
      }
      await db.update(emailLog).set({ status: "sent", resendId: data?.id ?? null, updatedAt: new Date() }).where(eq(emailLog.key, key));
      return `sent ${data?.id}`;
    });
  },
);
