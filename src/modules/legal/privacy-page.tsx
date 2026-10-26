import { LEGAL } from "@/lib/constants";
import LegalDocument, { LegalSection } from "./components/legal-document";

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy"
      accent="policy."
      intro="This policy explains what CourseIt collects when you use it, why, who it is shared with, and how you can see, change or delete it."
    >
      <LegalSection title="1. Who we are">
        <p>
          CourseIt (&quot;we&quot;, &quot;us&quot;) turns YouTube videos and playlists into structured courses with lessons, quizzes and a study plan.
          CourseIt is operated by {LEGAL.operator}. You can reach us at {LEGAL.contactEmail}.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <ul className="flex flex-col gap-2">
          <li>
            <strong>Account details.</strong> When you sign in with Google, GitHub or X, we receive your name, email address (if the provider shares
            it), profile picture and an account ID from that provider. We never see your password.
          </li>
          <li>
            <strong>What you add.</strong> The YouTube links you turn into courses, your notes, quiz answers, chosen pace, progress and streaks.
          </li>
          <li>
            <strong>YouTube data.</strong> For the videos you add, we use YouTube API Services to read public information such as titles, channel names,
            durations, chapters, thumbnails and captions.
          </li>
          <li>
            <strong>Technical data.</strong> A sign-in cookie, your theme preference stored in your browser, and basic server logs (such as IP address
            and browser type) kept for security and debugging.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. YouTube API Services">
        <p>
          CourseIt uses YouTube API Services. By using CourseIt you also agree to the{" "}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer">
            YouTube Terms of Service
          </a>
          , and Google&apos;s handling of data is described in the{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
            Google Privacy Policy
          </a>
          .
        </p>
        <p>
          Videos play in YouTube&apos;s own embedded player, which may set its own cookies. We do not download or store video or audio files. YouTube data
          we store is refreshed or deleted at least every 30 days.
        </p>
      </LegalSection>

      <LegalSection title="4. How we use your information">
        <ul className="flex flex-col gap-2">
          <li>To create your account and keep you signed in.</li>
          <li>To build courses, placement tests, quizzes, study notes and your daily plan, and to track your progress and streaks.</li>
          <li>To keep CourseIt secure, fix problems and improve features.</li>
        </ul>
        <p>
          <strong>AI processing.</strong> To build a course, we fetch the public video&apos;s captions from Supadata (or, if it has none, Google Gemini
          watches the public video), and send the transcript to NVIDIA Nemotron models running on Nebius Token Factory. Lesson and course titles are sent
          to Tavily to find further reading. We send course content for these steps, not your name or email.
        </p>
        <p>
          <strong>Support and administration.</strong> The CourseIt team can view your account details (name, email, sign-in provider), when you were
          active, the courses and roadmaps you take or make, and your progress, so we can answer your questions, fix problems and prevent abuse. We see
          how many notes and quiz answers you have, not what they say. We look at this only when needed for those reasons.
        </p>
        <p>We do not sell your personal information and we do not show ads.</p>
      </LegalSection>

      <LegalSection title="5. Who we share it with">
        <p>Only with services that help us run CourseIt, under their own privacy terms:</p>
        <ul className="flex flex-col gap-2">
          <li>Sign-in providers: Google, GitHub and X.</li>
          <li>AI, captions and search: Nebius (Token Factory), Google (Gemini), Supadata and Tavily.</li>
          <li>Hosting and storage providers that run our website and database.</li>
        </ul>
        <p>
          Courses generated from public videos (lessons, quizzes, notes we generate) may be reused for other learners who add the same video. They never
          include your personal notes, answers or account details. We may also disclose information if the law requires it.
        </p>
      </LegalSection>

      <LegalSection title="6. Google user data">
        <p>
          CourseIt&apos;s use and transfer of information received from Google APIs adheres to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </LegalSection>

      <LegalSection title="7. Keeping and deleting your data">
        <p>
          We keep your account data while your account is active. To delete your account and data, email {LEGAL.contactEmail}; we delete it within 30
          days.
        </p>
        <p>You can also remove CourseIt&apos;s access at any time from your provider&apos;s settings:</p>
        <ul className="flex flex-col gap-2">
          <li>
            Google:{" "}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
              Third-party apps with account access
            </a>
          </li>
          <li>
            GitHub:{" "}
            <a href="https://github.com/settings/applications" target="_blank" rel="noreferrer">
              Authorized OAuth Apps
            </a>
          </li>
          <li>
            X:{" "}
            <a href="https://x.com/settings/connected_apps" target="_blank" rel="noreferrer">
              Connected apps
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Your rights">
        <p>
          You can ask to see, correct, export or delete your personal information by emailing {LEGAL.contactEmail}. Depending on where you live, you may
          have further rights under local law, including the right to complain to a data protection authority.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>CourseIt is not meant for children under 13 (or under 16 where local law requires). We do not knowingly collect their information.</p>
      </LegalSection>

      <LegalSection title="10. Security">
        <p>We use encrypted connections and signed session cookies. No service is perfectly secure, so please tell us if you spot a problem.</p>
      </LegalSection>

      <LegalSection title="11. Changes to this policy">
        <p>If we change this policy, we will update the date at the top and, for significant changes, let signed-in users know.</p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>Questions about privacy? Email {LEGAL.contactEmail}.</p>
      </LegalSection>
    </LegalDocument>
  );
}
