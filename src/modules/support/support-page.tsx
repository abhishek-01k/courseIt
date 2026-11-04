import { Lock, Mail, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import PageHeader from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { isPaid, usageFor } from "@/lib/billing";
import { LEGAL } from "@/lib/constants";

// /support: how to reach us. There's no mail service, so "Email support" opens the learner's own mail app with
// their account details filled in, which saves a round of "which account is this?".
async function EmailCard() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect("/login");
  const usage = await usageFor(user.id);
  const body = ["Hi CourseIt team,", "", "", "", "---", `Account: ${user.email ?? user.id}`, `Plan: ${usage.admin ? "Admin" : usage.plan.name}`].join("\n");
  const href = `mailto:${LEGAL.contactEmail}?subject=${encodeURIComponent("CourseIt support")}&body=${encodeURIComponent(body)}`;

  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-[1.1rem] font-medium">Email us</p>
        <p className="text-[0.92rem] text-ink-soft">
          Write to <a href={`mailto:${LEGAL.contactEmail}`} className="font-medium text-ink underline underline-offset-2">{LEGAL.contactEmail}</a>. A
          person reads every message. Send from {user.email ? <span className="text-ink">{user.email}</span> : "the email you sign in with"} so we can find
          your account.
        </p>
      </div>
      <a href={href} className={buttonVariants({ size: "lg", className: "shrink-0 gap-2" })}>
        <Mail aria-hidden="true" className="size-4" />
        Email support
      </a>
    </div>
  );
}

// Chat support is a Pro and Max perk. The handles live in env vars, not the code (the code is public):
// SUPPORT_WHATSAPP is a number with country code, digits only (919876543210); SUPPORT_TELEGRAM is a username.
async function ChatCard() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect("/login");
  const whatsapp = process.env.SUPPORT_WHATSAPP?.replace(/\D/g, "");
  const telegram = process.env.SUPPORT_TELEGRAM?.replace(/^@/, "");
  if (!whatsapp && !telegram) return null;

  const usage = await usageFor(user.id);
  if (!isPaid(usage)) {
    return (
      <div className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2 text-[1.1rem] font-medium">
            <Lock aria-hidden="true" className="size-4 text-ink-soft" />
            Chat with us
          </p>
          <p className="text-[0.92rem] text-ink-soft">Pro and Max members can message us on WhatsApp or Telegram for faster help.</p>
        </div>
        <Link href="/plans" className={buttonVariants({ size: "lg", variant: "outline", className: "shrink-0" })}>
          See plans
        </Link>
      </div>
    );
  }

  const hello = `Hi CourseIt team! (${user.email ?? user.id}, ${usage.admin ? "Admin" : usage.plan.name})`;
  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-[0_0_0_1px_var(--line)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-[1.1rem] font-medium">Chat with us</p>
        <p className="text-[0.92rem] text-ink-soft">As a {usage.admin ? "Max" : usage.plan.name} member you can message us directly. We reply on working days.</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(hello)}`} target="_blank" rel="noreferrer" className={buttonVariants({ size: "lg", className: "gap-2" })}>
            <MessageCircle aria-hidden="true" className="size-4" />
            WhatsApp
          </a>
        )}
        {telegram && (
          <a href={`https://t.me/${encodeURIComponent(telegram)}`} target="_blank" rel="noreferrer" className={buttonVariants({ size: "lg", variant: "outline", className: "gap-2" })}>
            <Send aria-hidden="true" className="size-4" />
            Telegram
          </a>
        )}
      </div>
    </div>
  );
}

const HELP: [string, React.ReactNode][] = [
  [
    "Billing, cards and cancelling",
    <>
      Change your card, switch plans or cancel from <Link href="/settings">Settings → Manage billing</Link>. Invoices are under Billing history in the same
      place. For refunds, see the <Link href="/refunds">Refund policy</Link> and email us; we reply within 3–5 working days.
    </>,
  ],
  [
    "Hit your course limit?",
    <>
      Free includes one course per account; on Pro and Max, each new course counts for 30 days. Joining a course someone already built is always free. See <Link href="/plans">Plans</Link> for more builds a month.
    </>,
  ],
  ["A course didn't finish building", "Open it and choose Retry. It keeps every lesson that's done and only builds what's missing. Still stuck? Email us the link."],
  ["Something looks wrong in a lesson", "Email us the course link and which lesson, and what you expected to see."],
];

export default function SupportPage() {
  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-8 px-4 pt-8 pb-20 sm:px-6">
      <PageHeader label="Support" title="We're here" accent="to help." />
      <Suspense fallback={<Skeleton className="h-28 rounded-card" />}>
        <EmailCard />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-24 rounded-card" />}>
        <ChatCard />
      </Suspense>
      <section aria-labelledby="help-title" className="flex flex-col gap-5">
        <h2 id="help-title" className="text-h3 font-medium">
          Quick answers
        </h2>
        {HELP.map(([q, a]) => (
          <div key={q} className="flex flex-col gap-1.5">
            <h3 className="font-medium">{q}</h3>
            <p className="text-ink-soft [&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2">{a}</p>
          </div>
        ))}
      </section>
      <p className="text-[0.88rem] text-ink-soft">
        CourseIt is a product of {LEGAL.operator}.{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy
        </Link>
      </p>
    </div>
  );
}
