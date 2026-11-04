import { render } from "@react-email/components";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { announcementEmail } from "@/emails/templates";
import { requireAdmin } from "@/lib/admin";
import { AUDIENCE_LABEL, card } from "./announcements-page";
import AnnouncementForm from "./components/announcement-form";
import SendPanel from "./components/send-panel";
import { announcementStats, audienceSizes, getAnnouncement } from "./queries";

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="flex flex-col rounded-[14px] bg-paper px-4 py-3">
    <span className="font-display text-[1.6rem] leading-none tabular-nums">{value}</span>
    <span className="mt-1 text-[0.8rem] text-ink-soft">{label}</span>
  </div>
);

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const a = await getAnnouncement(id);
  if (!a) notFound();
  // The real email, as a learner would see it (unsubscribe link disabled in the preview).
  const html = await render(announcementEmail(a, "Learner", "#").body);
  const draft = a.status === "draft";
  const [sizes, stats] = await Promise.all([audienceSizes(), draft ? null : announcementStats(id)]);
  const reach = sizes[a.audience];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        {draft ? (
          <>
            <section className={card}>
              <h2 className="text-h3 font-medium">Send</h2>
              <p className="text-[0.92rem] text-ink-soft">
                To <strong className="font-medium text-ink">{AUDIENCE_LABEL[a.audience]}</strong>: {reach.people.toLocaleString("en")} {reach.people === 1 ? "person" : "people"} in their Inbox,{" "}
                {reach.emails.toLocaleString("en")} by email.
              </p>
              <SendPanel id={a.id} people={reach.people} emails={reach.emails} />
            </section>
            <section className={card}>
              <h2 className="text-h3 font-medium">Edit</h2>
              <AnnouncementForm id={a.id} initial={a} sizes={sizes} />
            </section>
          </>
        ) : (
          <section className={card}>
            <h2 className="text-h3 font-medium">{a.status === "sending" ? "Sending…" : "Sent"}</h2>
            <p className="text-[0.92rem] text-ink-soft">
              To {AUDIENCE_LABEL[a.audience]}
              {a.sentAt && ` on ${a.sentAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`}. Delivery numbers fill in as Resend reports them.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="In Inbox" value={stats!.inbox} />
              <Stat label="Opened in Inbox" value={stats!.read} />
              <Stat label="Emails sent" value={(stats!.emails.sent ?? 0) + (stats!.emails.delivered ?? 0) + (stats!.emails.bounced ?? 0) + (stats!.emails.complained ?? 0)} />
              <Stat label="Delivered" value={stats!.emails.delivered ?? 0} />
              <Stat label="Bounced" value={stats!.emails.bounced ?? 0} />
              <Stat label="Marked as spam" value={stats!.emails.complained ?? 0} />
            </div>
          </section>
        )}
      </div>
      <section className={card}>
        <h2 className="text-h3 font-medium">Preview</h2>
        <p className="-mt-2 text-[0.85rem] text-ink-soft">Subject: {a.subject}</p>
        <iframe title="Email preview" srcDoc={html} sandbox="" className="h-[640px] w-full rounded-[14px] bg-paper shadow-[0_0_0_1px_var(--line)]" />
      </section>
    </div>
  );
}

export default function AnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/announcements" className="inline-flex items-center gap-2 self-start text-[0.9rem] text-ink-soft hover:text-ink">
        <ArrowLeft aria-hidden="true" className="size-4" />
        All announcements
      </Link>
      <Suspense fallback={<Skeleton className="h-[640px] rounded-card" />}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}
