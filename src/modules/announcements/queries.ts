import { count, desc, eq, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { announcements, emailLog, notifications } from "@/db/schema";

export const listAnnouncements = () => db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(50);

export async function getAnnouncement(id: string) {
  const [a] = await db.select().from(announcements).where(eq(announcements.id, id));
  return a ?? null;
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
