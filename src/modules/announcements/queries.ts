import { count, desc, eq, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { announcements, emailLog, notifications, users } from "@/db/schema";
import { audienceWhere } from "@/inngest/send-announcement";

export const listAnnouncements = () => db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(50);

export async function getAnnouncement(id: string) {
  const [a] = await db.select().from(announcements).where(eq(announcements.id, id));
  return a ?? null;
}

/** How many learners each audience reaches right now, and how many of them would get an email. */
export async function audienceSizes() {
  const sizes = async (audience: "all" | "free" | "paid" | "admins") => {
    const [r] = await db
      .select({
        people: count(),
        emails: sql<number>`count(*) filter (where ${users.email} is not null and ${users.emailSuppressedAt} is null and ${users.emailNews})`.mapWith(Number),
      })
      .from(users)
      .where(audienceWhere(audience));
    return r;
  };
  const [all, free, paid, admins] = await Promise.all([sizes("all"), sizes("free"), sizes("paid"), sizes("admins")]);
  return { all, free, paid, admins };
}

/** For a sent announcement: Inbox messages, and emails by delivery status (filled in by the Resend webhook). */
export async function announcementStats(id: string) {
  const prefix = `announcement:${id}:%`;
  const [[inbox], byStatus] = await Promise.all([
    db.select({ n: count() }).from(notifications).where(like(notifications.key, prefix)),
    db.select({ status: emailLog.status, n: count() }).from(emailLog).where(like(emailLog.key, prefix)).groupBy(emailLog.status),
  ]);
  const emails = Object.fromEntries(byStatus.map((r) => [r.status, r.n])) as Record<string, number>;
  const read = (await db.select({ n: count() }).from(notifications).where(sql`${notifications.key} like ${prefix} and ${notifications.readAt} is not null`))[0].n;
  return { inbox: inbox.n, read, emails };
}
