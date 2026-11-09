import Link from "next/link";
import { LEGAL } from "@/lib/constants";
import LegalDocument, { LegalSection } from "./components/legal-document";

// Refund window: change it here and the page follows.
const REFUND_DAYS = 7;

export default function RefundsPage() {
  return (
    <LegalDocument
      title="Refunds and"
      accent="cancellation."
      intro="How cancelling works, when you can get your money back, and how to ask. Payments are handled by Dodo Payments, our merchant of record."
    >
      <LegalSection title="1. Cancelling">
        <p>
          You can cancel your plan at any time from <Link href="/settings">Settings → Manage billing</Link>. Cancelling stops the next renewal. You keep
          your plan until the end of the period you already paid for, and then it ends. Every course you built stays yours, and joining courses others
          built stays free.
        </p>
      </LegalSection>

      <LegalSection title="2. When we refund">
        <p>We give a full refund when:</p>
        <ul className="flex flex-col gap-2">
          <li>
            you ask within {REFUND_DAYS} days of a charge (a new plan, a renewal or an upgrade) <strong>and</strong> you haven&apos;t built a new course
            since that charge;
          </li>
          <li>you were charged twice, or charged after you cancelled;</li>
          <li>CourseIt didn&apos;t work for you and we couldn&apos;t fix it.</li>
        </ul>
        <p>
          Building a course is what costs us money, so once you&apos;ve built courses in a billing period we don&apos;t refund that period, and we
          don&apos;t give partial refunds for unused time after cancelling. If something feels unfair, email us anyway; we look at every request.
        </p>
      </LegalSection>

      <LegalSection title="3. How to ask">
        <p>
          Email <a href={`mailto:${LEGAL.contactEmail}?subject=${encodeURIComponent("CourseIt refund request")}`}>{LEGAL.contactEmail}</a> from the email
          you sign in with, with the date of the charge and a line on why. We reply within 3–5 working days.
        </p>
        <p>
          Approved refunds go back to the card or payment method you paid with, through Dodo Payments. Your bank may take another 5–10 working days to
          show it. When a plan is refunded in full, it ends.
        </p>
      </LegalSection>

      <LegalSection title="4. Customers in the EU and UK">
        <p>
          You may have a legal right to cancel a new subscription within 14 days. If you build a course in that time, you ask us to start the service
          straight away, and a refund may be reduced for what you used. Nothing in this policy limits your rights under local consumer law.
        </p>
      </LegalSection>

      <LegalSection title="5. Taxes">
        <p>
          In India, prices are in rupees and include GST. In the UK, they are in pounds and include VAT. Everywhere else, prices are in US dollars and
          Dodo Payments adds any sales tax or VAT at checkout. A refund includes the tax you paid.
        </p>
      </LegalSection>

      <LegalSection title="6. Contact">
        <p>
          Questions? Email {LEGAL.contactEmail}. CourseIt is operated by {LEGAL.operator}. See also our <Link href="/terms">Terms</Link>.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
