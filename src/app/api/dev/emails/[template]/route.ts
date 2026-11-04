import { render } from "@react-email/components";
import type { NextRequest } from "next/server";
import { type Template, TEMPLATES } from "@/emails/templates";

// Local only: /api/dev/emails/<template> shows an email with sample data, so templates can be checked in a
// browser before anything is sent. 404 in production.
const SAMPLES: { [T in Template]: Parameters<(typeof TEMPLATES)[T]>[0] } = {
  welcome: { name: "Abhishek Singh" },
  courseReady: { name: "Abhishek", title: "Andrej Karpathy: Intro to Large Language Models", slug: "sample", lessons: 26, missing: 0 },
  buildStopped: { name: "Abhishek", title: "Sam Altman on the future of AI", slug: "sample", canRetry: false },
  planStarted: { name: "Abhishek", plan: "Pro", courses: 5, hours: 30 },
  paymentFailed: { name: "Abhishek", plan: "Pro" },
  planEnding: { name: "Abhishek", plan: "Pro", endsAt: "2026-12-04T00:00:00Z" },
  renewalReminder: { name: "Abhishek", plan: "Max", renewsAt: "2026-11-11T00:00:00Z", amount: "₹9,999 (incl. GST)" },
};

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/dev/emails/[template]">) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const { template } = await ctx.params;
  if (template === "index") {
    const links = Object.keys(TEMPLATES).map((t) => `<li><a href="/api/dev/emails/${t}">${t}</a></li>`).join("");
    return new Response(`<!doctype html><title>Emails</title><body style="font-family:sans-serif;padding:24px"><h1>CourseIt emails</h1><ul>${links}</ul>`, { headers: { "Content-Type": "text/html" } });
  }
  if (!(template in TEMPLATES)) return new Response("Unknown template", { status: 404 });
  const t = template as Template;
  const { subject, body } = (TEMPLATES[t] as (p: unknown) => { subject: string; body: React.ReactElement })(SAMPLES[t]);
  const html = await render(body);
  return new Response(html.replace("<body", `<div style="font-family:sans-serif;padding:10px 16px;background:#222;color:#eee">Subject: ${subject.replace(/</g, "&lt;")}</div><body`), { headers: { "Content-Type": "text/html" } });
}
