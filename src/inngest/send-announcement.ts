import { render } from "@react-email/components";
import { and, eq, gt, inArray, isNull, ne, or, type SQL, sql } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { announcements, emailLog, notifications, users } from "@/db/schema";
import { announcementEmail } from "@/emails/templates";
import { admins } from "@/lib/admin";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import { ANNOUNCEMENT_SEND, inngest } from "./client";

const BATCH = 100; // Resend's batch API takes up to 100 emails per call

// Same rule as hasPaidAccess in src/lib/billing.ts, as SQL: on Pro or Max, or cancelled but still in the paid period.
const paid = and(
  ne(users.plan, "free"),
  or(inArray(users.planStatus, ["active", "past_due"]), and(eq(users.planStatus, "cancelled"), gt(users.planRenewsAt, sql`now()`))),
) as SQL;

export const audienceWhere = (audience: "all" | "free" | "paid" | "admins"): SQL | undefined =>
  audience === "paid"
    ? paid
    : audience === "free"
      ? sql`not (${paid})`
      : audience === "admins"
        ? inArray(sql`lower(${users.email})`, admins().length ? admins() : [""])
        : undefined;

// Admin → Announcements → Send. Everyone in the audience gets it in their Inbox; those with an email address that
// hasn't bounced and who haven't unsubscribed also get it by email, 100 per Resend call. Each batch is its own step
// with its own idempotency key, so a retry or a crash halfway never sends anyone a second copy.
export const sendAnnouncement = inngest.createFunction(
  { id: "send-announcement", triggers: [{ event: ANNOUNCEMENT_SEND }], retries: 4, concurrency: { limit: 1, key: "event.data.announcementId" } },
  async ({ event, step }) => {
    const { announcementId } = event.data as { announcementId: string };

    const recipients = await step.run("recipients", async () => {
      const [a] = await db.select({ audience: announcements.audience, status: announcements.status }).from(announcements).where(eq(announcements.id, announcementId));
      if (!a || a.status === "sent") return [];
      const rows = await db.select({ id: users.id }).from(users).where(audienceWhere(a.audience));
      await db.update(announcements).set({ status: "sending", recipients: rows.length }).where(eq(announcements.id, announcementId));
      return rows.map((r) => r.id);
    });

    let emailed = 0;
    for (let i = 0; i < recipients.length; i += BATCH) {
      emailed += await step.run(`batch ${i / BATCH + 1}`, async () => {
        const [a] = await db.select().from(announcements).where(eq(announcements.id, announcementId));
        const people = await db
          .select({ id: users.id, email: users.email, name: users.name, suppressed: users.emailSuppressedAt, news: users.emailNews })
          .from(users)
          .where(inArray(users.id, recipients.slice(i, i + BATCH)));
        const key = (userId: string) => `announcement:${announcementId}:${userId}`;

        // Inbox: everyone.
        const built = people.map((p) => ({ p, msg: announcementEmail(a, p.name, unsubscribeUrl(p.id)) }));
        await db
          .insert(notifications)
          .values(built.map(({ p, msg }) => ({ key: key(p.id), userId: p.id, title: msg.note.title, body: msg.note.text, href: msg.note.href })))
          .onConflictDoNothing();

        // Email: those we can and may email, and haven't already (a retried batch).
        const done = new Set(
          (await db.select({ key: emailLog.key }).from(emailLog).where(and(inArray(emailLog.key, people.map((p) => key(p.id))), ne(emailLog.status, "failed")))).map((r) => r.key),
        );
        const to = built.filter(({ p }) => p.email && !p.suppressed && p.news && !done.has(key(p.id)));
        if (!to.length) return 0;

        const emails = await Promise.all(
          to.map(async ({ p, msg }) => {
            const unsubscribe = unsubscribeUrl(p.id);
            return {
              from: process.env.EMAIL_FROM ?? "CourseIt <hello@mail.courseit.xyz>",
              replyTo: process.env.EMAIL_REPLY_TO ?? "hello@triggerfy.xyz",
              to: p.email!,
              subject: msg.subject,
              html: await render(msg.body),
              text: await render(msg.body, { plainText: true }),
              // One-click unsubscribe in Gmail and Yahoo (required for bulk senders).
              headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
              tags: [{ name: "template", value: "announcement" }],
            };
          }),
        );
        const { data, error } = await new Resend(process.env.RESEND_API_KEY).batch.send(emails, { idempotencyKey: `announcement:${announcementId}:batch:${i}` });
        if (error) throw new Error(`Resend batch ${error.name}: ${error.message}`); // Inngest retries this batch only
        const ids = data?.data ?? [];
        await db
          .insert(emailLog)
          .values(to.map(({ p }, j) => ({ key: key(p.id), userId: p.id, template: "announcement", to: p.email, status: "sent" as const, resendId: ids[j]?.id ?? null })))
          .onConflictDoUpdate({ target: emailLog.key, set: { status: "sent", updatedAt: new Date() } });
        return to.length;
      });
    }

    await step.run("done", () => db.update(announcements).set({ status: "sent", sentAt: new Date() }).where(and(eq(announcements.id, announcementId), isNull(announcements.sentAt))));
    return { recipients: recipients.length, emailed };
  },
);
