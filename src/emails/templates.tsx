import { PLANS } from "@/lib/plans";
import { appUrl, EmailLayout, P, Strong } from "./layout";

// Every email CourseIt sends. Each takes the details it needs and returns a subject and the email itself.
// To add one: write it here, then queue it with queueEmail (src/inngest/send-email.ts).

const date = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const hi = (name?: string | null) => (name ? `Hi ${name.split(" ")[0]},` : "Hi,");

type Email = { subject: string; body: React.ReactElement };

export const TEMPLATES = {
  welcome: ({ name }: { name?: string | null }): Email => ({
    subject: "Welcome to CourseIt",
    body: (
      <EmailLayout preview="Turn any long YouTube video into a course with lessons, quizzes and a daily plan." heading="Welcome to CourseIt" cta={{ label: "Build your first course", href: appUrl("/new") }}>
        <P>{hi(name)}</P>
        <P>
          Paste any long YouTube video or playlist and CourseIt turns it into a course: short lessons, notes, quizzes and a plan that fits your day.
        </P>
        <P>
          <Strong>Your first course is free</Strong>, up to {PLANS.free.maxHours} hours long. Courses other learners already built are always free to join, so check
          Community too.
        </P>
      </EmailLayout>
    ),
  }),

  courseReady: ({ name, title, slug, lessons, missing }: { name?: string | null; title: string; slug: string; lessons: number; missing: number }): Email => ({
    subject: `Your course is ready: ${title}`,
    body: (
      <EmailLayout preview={`${lessons} lessons, notes and quizzes, ready when you are.`} heading="Your course is ready" cta={{ label: "Start lesson 1", href: appUrl(`/courses/${slug}`) }}>
        <P>{hi(name)}</P>
        <P>
          <Strong>{title}</Strong> is built: {lessons} lessons with notes and quizzes, split into a daily plan.
        </P>
        {missing > 0 && (
          <P>
            {missing} {missing === 1 ? "lesson" : "lessons"} couldn&apos;t be written yet. The rest of the course is ready to use, and you can retry the
            missing ones from the course page.
          </P>
        )}
      </EmailLayout>
    ),
  }),

  buildStopped: ({ name, title, slug, canRetry }: { name?: string | null; title: string; slug: string; canRetry: boolean }): Email => ({
    subject: `We couldn't finish your course: ${title}`,
    body: (
      <EmailLayout
        preview="Something went wrong while building it. Everything already written is kept."
        heading="Your course stopped building"
        cta={canRetry ? { label: "Retry the build", href: appUrl(`/courses/${slug}`) } : { label: "See plans", href: appUrl("/plans?reason=retry") }}
      >
        <P>{hi(name)}</P>
        <P>
          Something went wrong while building <Strong>{title}</Strong>, usually because the AI was busy. Every lesson already written is kept.
        </P>
        <P>
          {canRetry
            ? "Press Retry on the course page and it picks up where it stopped."
            : "Retrying a build is part of Pro and Max. Upgrade and Retry picks up where it stopped."}
        </P>
      </EmailLayout>
    ),
  }),

  planStarted: ({ name, plan, courses, hours }: { name?: string | null; plan: string; courses: number; hours: number }): Email => ({
    subject: `Welcome to CourseIt ${plan}`,
    body: (
      <EmailLayout preview={`${courses} new courses a month, ${hours} hours of video. Thanks for supporting CourseIt.`} heading={`You're on ${plan}`} cta={{ label: "Build a course", href: appUrl("/new") }}>
        <P>{hi(name)}</P>
        <P>
          Thanks for upgrading. With <Strong>{plan}</Strong> you can build <Strong>{courses} new courses a month</Strong>, up to {hours} hours of video
          in total. You can also retry builds that stopped, and your builds go first when it&apos;s busy.
        </P>
        <P>Your receipt comes separately from Dodo Payments, our payment partner. Manage or cancel any time from Settings → Manage billing.</P>
      </EmailLayout>
    ),
  }),

  paymentFailed: ({ name, plan }: { name?: string | null; plan: string }): Email => ({
    subject: "Your CourseIt payment didn't go through",
    body: (
      <EmailLayout preview={`Update your card to keep ${plan}.`} heading="Your payment didn't go through" cta={{ label: "Update payment method", href: appUrl("/api/billing/portal") }}>
        <P>{hi(name)}</P>
        <P>
          We couldn&apos;t take the payment for your <Strong>{plan}</Strong> plan. This usually means the card expired or the bank declined it.
        </P>
        <P>Update your payment method and your plan carries on as before. Your courses and progress are safe either way.</P>
      </EmailLayout>
    ),
  }),

  planEnding: ({ name, plan, endsAt }: { name?: string | null; plan: string; endsAt: string }): Email => ({
    subject: `Your ${plan} plan ends on ${date(endsAt)}`,
    body: (
      <EmailLayout preview="You keep everything until then. Changed your mind? Keep your plan in one click." heading={`Your ${plan} plan is ending`} cta={{ label: "Keep my plan", href: appUrl("/api/billing/portal") }}>
        <P>{hi(name)}</P>
        <P>
          Your <Strong>{plan}</Strong> plan won&apos;t renew. You keep it until <Strong>{date(endsAt)}</Strong>, then your account moves to Free.
        </P>
        <P>Every course you built stays yours, with all your notes and progress. Changed your mind? You can keep your plan from Manage billing.</P>
      </EmailLayout>
    ),
  }),

  renewalReminder: ({ name, plan, renewsAt, amount }: { name?: string | null; plan: string; renewsAt: string; amount: string }): Email => ({
    subject: `Your ${plan} plan renews on ${date(renewsAt)}`,
    body: (
      <EmailLayout preview={`${amount} for another year of ${plan}. Nothing to do if you'd like to continue.`} heading="Your yearly plan renews soon" cta={{ label: "Manage billing", href: appUrl("/api/billing/portal") }}>
        <P>{hi(name)}</P>
        <P>
          Your yearly <Strong>{plan}</Strong> plan renews on <Strong>{date(renewsAt)}</Strong> for <Strong>{amount}</Strong>. There&apos;s nothing to
          do if you&apos;d like to keep it.
        </P>
        <P>To change or cancel, use Manage billing before then.</P>
      </EmailLayout>
    ),
  }),
};

export type Template = keyof typeof TEMPLATES;
export type TemplateProps<T extends Template> = Parameters<(typeof TEMPLATES)[T]>[0];
