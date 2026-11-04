import { Body, Button, Container, Head, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import { LEGAL } from "@/lib/constants";

// The site's light theme, written out: email clients don't read CSS variables or web fonts reliably.
export const C = { paper: "#fcfcfa", surface: "#ffffff", ink: "#0f1611", soft: "#4c4c3d", moss: "#4b5e1e", onMoss: "#f6f8ec", lime: "#e4e9c6", line: "#e6e7e3" };
const font = '"Helvetica Neue", Helvetica, Arial, sans-serif';

/** Where links in emails point. Set APP_URL per environment; production is the live site. */
export const appUrl = (path = "") => `${(process.env.APP_URL ?? "https://www.courseit.xyz").replace(/\/$/, "")}${path}`;

/** Every CourseIt email: a white card on the site's paper colour, one heading, one button, a short footer. */
export function EmailLayout({ preview, heading, children, cta }: { preview: string; heading: string; children: React.ReactNode; cta?: { label: string; href: string } }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: C.paper, fontFamily: font, margin: 0, padding: "32px 12px" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto" }}>
          <Text style={{ fontSize: 18, fontWeight: 600, color: C.ink, margin: "0 0 16px 4px" }}>🎓 CourseIt</Text>
          <Section style={{ backgroundColor: C.surface, borderRadius: 20, border: `1px solid ${C.line}`, padding: "28px 28px 24px" }}>
            <Text style={{ fontSize: 24, lineHeight: "30px", fontWeight: 600, color: C.ink, margin: "0 0 14px" }}>{heading}</Text>
            {children}
            {cta && (
              <Button
                href={cta.href}
                style={{ backgroundColor: C.moss, color: C.onMoss, borderRadius: 999, padding: "13px 24px", fontSize: 15, fontWeight: 600, marginTop: 10, textDecoration: "none" }}
              >
                {cta.label}
              </Button>
            )}
          </Section>
          <Hr style={{ borderColor: C.line, margin: "24px 0 12px" }} />
          <Text style={{ fontSize: 12, lineHeight: "18px", color: C.soft, margin: "0 4px" }}>
            You&apos;re getting this because you have a CourseIt account. Questions? Just reply, or write to{" "}
            <Link href={`mailto:${LEGAL.contactEmail}`} style={{ color: C.moss }}>
              {LEGAL.contactEmail}
            </Link>
            .
            <br />
            CourseIt is a product of {LEGAL.operator}. <Link href={appUrl("/settings")} style={{ color: C.moss }}>Settings</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const P = ({ children }: { children: React.ReactNode }) => <Text style={{ fontSize: 15, lineHeight: "23px", color: C.soft, margin: "0 0 12px" }}>{children}</Text>;
export const Strong = ({ children }: { children: React.ReactNode }) => <strong style={{ color: C.ink, fontWeight: 600 }}>{children}</strong>;
