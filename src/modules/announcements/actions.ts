"use server";

import { render } from "@react-email/components";
import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { db } from "@/db";
import { announcements, users } from "@/db/schema";
import { announcementEmail } from "@/emails/templates";
import { ANNOUNCEMENT_SEND, inngest } from "@/inngest/client";
import { requireAdmin } from "@/lib/admin";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import { parseFilter } from "@/modules/admin/learner-filter";
import { countLearners } from "@/modules/admin/queries";

export type AnnouncementFormState = { error?: string; ok?: string };

/** Live count for the form: how many learners the filter reaches right now, and how many by email. */
export async function countAudienceAction(raw: Record<string, unknown>) {
  await requireAdmin();
  return countLearners(parseFilter(raw));
}

/** Save a new announcement, or changes to a draft. Opens it afterwards, where it can be previewed and sent. */
export async function saveAnnouncementAction(id: string | null, _prev: AnnouncementFormState, form: FormData): Promise<AnnouncementFormState> {
  const adminId = await requireAdmin();
  const field = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const values = {
    subject: field("subject", 150),
    heading: field("heading", 120),
    body: field("body", 5000),
    ctaLabel: field("ctaLabel", 40) || null,
    ctaHref: field("ctaHref", 300) || null,
    filter: parseFilter(form),
  };
  if (!values.subject || !values.heading || !values.body) return { error: "Subject, heading and message are all needed." };
  if (Boolean(values.ctaLabel) !== Boolean(values.ctaHref)) return { error: "A button needs both a label and a link (or leave both empty)." };
  if (values.ctaHref && !values.ctaHref.startsWith("/") && !/^https:\/\//.test(values.ctaHref)) return { error: "The button link should be a path like /plans or a full https:// link." };

  if (id) {
    const [saved] = await db.update(announcements).set(values).where(and(eq(announcements.id, id), eq(announcements.status, "draft"))).returning({ id: announcements.id });
    if (!saved) return { error: "This announcement was already sent, so it can't be changed." };
    refresh();
    return { ok: "Saved." };
  }
  const [created] = await db.insert(announcements).values({ ...values, createdBy: adminId }).returning({ id: announcements.id });
  redirect(`/admin/announcements/${created.id}`);
}

/** Sends this announcement to the admin only, marked [Test], so it can be checked in a real inbox first. */
export async function sendTestAction(id: string): Promise<AnnouncementFormState> {
  const adminId = await requireAdmin();
  const [[a], [me]] = await Promise.all([
    db.select().from(announcements).where(eq(announcements.id, id)),
    db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, adminId)),
  ]);
  if (!a) return { error: "Announcement not found." };
  if (!me?.email) return { error: "Your account has no email address." };
  const msg = announcementEmail(a, me.name, unsubscribeUrl(adminId));
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.EMAIL_FROM ?? "CourseIt <hello@mail.courseit.xyz>",
    replyTo: process.env.EMAIL_REPLY_TO ?? "hello@triggerfy.xyz",
    to: me.email,
    subject: `[Test] ${msg.subject}`,
    html: await render(msg.body),
    text: await render(msg.body, { plainText: true }),
  });
  return error ? { error: `Resend: ${error.message}` } : { ok: `Test sent to ${me.email}.` };
}

/** Sends it for real. Only a draft can be sent, and only once: the status flips before the job is queued. */
export async function sendAnnouncementAction(id: string): Promise<AnnouncementFormState> {
  await requireAdmin();
  const [claimed] = await db.update(announcements).set({ status: "sending" }).where(and(eq(announcements.id, id), eq(announcements.status, "draft"))).returning({ id: announcements.id });
  if (!claimed) return { error: "This announcement is already sending or sent." };
  try {
    await inngest.send({ name: ANNOUNCEMENT_SEND, id: `announcement:${id}`, data: { announcementId: id } });
  } catch (error) {
    console.error(error);
    await db.update(announcements).set({ status: "draft" }).where(eq(announcements.id, id));
    return { error: "Couldn't start sending. Try again in a moment." };
  }
  refresh();
  return { ok: "Sending. Refresh in a minute to see the numbers." };
}

export async function deleteDraftAction(id: string) {
  await requireAdmin();
  await db.delete(announcements).where(and(eq(announcements.id, id), eq(announcements.status, "draft")));
  redirect("/admin/announcements");
}
