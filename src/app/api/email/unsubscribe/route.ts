import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { appUrl } from "@/emails/layout";
import { verifyUnsubscribe } from "@/lib/unsubscribe";

// The unsubscribe link in announcement emails. GET shows a confirm button (link scanners open every link, so a
// GET mustn't unsubscribe anyone); POST unsubscribes. Gmail's one-click unsubscribe POSTs here directly
// (List-Unsubscribe-Post header), which is why the token is in the URL rather than a session.

const page = (title: string, text: string, form = "") =>
  new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · CourseIt</title>
<body style="margin:0;background:#fcfcfa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#0f1611">
<main style="max-width:460px;margin:12vh auto;padding:28px;background:#fff;border:1px solid #e6e7e3;border-radius:20px">
<p style="margin:0 0 16px;font-weight:600">🎓 CourseIt</p><h1 style="font-size:22px;margin:0 0 10px">${title}</h1>
<p style="color:#4c4c3d;line-height:1.5;margin:0 0 18px">${text}</p>${form}
<p style="margin:18px 0 0;font-size:14px"><a style="color:#4b5e1e" href="${appUrl("/settings")}">Email settings</a></p></main></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

function check(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("u") ?? "";
  const token = url.searchParams.get("t") ?? "";
  return userId && token && verifyUnsubscribe(userId, token) ? userId : null;
}

export async function GET(request: Request) {
  if (!check(request)) return page("Link not valid", "This unsubscribe link is broken. You can turn emails off in Settings instead.");
  const action = new URL(request.url);
  return page(
    "Unsubscribe from CourseIt news?",
    "You'll stop getting announcements by email. Emails about your account, like a course being ready or a payment, still arrive.",
    `<form method="post" action="${action.pathname}${action.search}"><button style="background:#4b5e1e;color:#f6f8ec;border:0;border-radius:999px;padding:12px 22px;font-size:15px;font-weight:600;cursor:pointer">Unsubscribe</button></form>`,
  );
}

export async function POST(request: Request) {
  const userId = check(request);
  if (!userId) return page("Link not valid", "This unsubscribe link is broken. You can turn emails off in Settings instead.");
  await db.update(users).set({ emailNews: false }).where(eq(users.id, userId));
  return page("You're unsubscribed", "You won't get CourseIt announcements by email any more. Changed your mind? Turn them back on in Settings.");
}
