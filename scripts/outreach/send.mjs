// Sends the outreach emails through Resend, a few a day, and one follow-up to anyone who hasn't been marked as replied.
// Without --send it only prints what it would send.
//   node --env-file=.env.local scripts/outreach/send.mjs --list outreach/creators.csv            (preview)
//   node --env-file=.env.local scripts/outreach/send.mjs --list outreach/creators.csv --send     (really send)
//   options: --limit 20 (emails per day, first emails and follow-ups together)  --followup-days 5  --no-followup  --test you@example.com
// Needs OUTREACH_FROM (and RESEND_API_KEY with --send). Use a different domain from EMAIL_FROM: cold email that gets
// marked as spam must not hurt the domain that delivers sign-in and product emails.
// outreach/sent.json remembers who got what, so running it every day never emails anyone twice.
// outreach/suppress.txt: one email per line. Add everyone who replies or says no. They are never emailed again.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { args, readCsv } from "./lib.mjs";
import { TEMPLATES } from "./templates.mjs";

const a = args();
const list = a.list ?? "outreach/creators.csv";
const limit = Number(a.limit ?? 20);
const followupDays = Number(a["followup-days"] ?? 5);
const LOG = "outreach/sent.json";
const SUPPRESS = "outreach/suppress.txt";

const from = process.env.OUTREACH_FROM; // "Asha from CourseIt <asha@trycourseit.xyz>"
if (!from) throw new Error('OUTREACH_FROM is not set, e.g. OUTREACH_FROM="Asha from CourseIt <asha@your-outreach-domain.xyz>"');
const address = /<([^>]+)>/.exec(from)?.[1] ?? from;
const replyTo = process.env.OUTREACH_REPLY_TO ?? address;
const me = { name: process.env.OUTREACH_SENDER_NAME ?? from.split(/ from | </)[0].trim(), site: (process.env.APP_URL ?? "https://www.courseit.xyz").replace(/^https?:\/\/(www\.)?/, "") };
if (a.send && !process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");

const log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, "utf8")) : {};
const suppressed = new Set(existsSync(SUPPRESS) ? readFileSync(SUPPRESS, "utf8").split("\n").map((l) => l.trim().toLowerCase()).filter(Boolean) : []);
const today = new Date().toISOString().slice(0, 10);
const sentToday = Object.values(log).flatMap((l) => [l.first, l.followup]).filter((d) => d?.startsWith(today)).length;
const daysSince = (iso) => (Date.now() - new Date(iso).getTime()) / 86_400_000;

// Follow-ups first (they are owed), then new people, up to today's limit.
const rows = readCsv(list).filter((r) => /^\S+@\S+\.\S+$/.test(r.email) && !suppressed.has(r.email.toLowerCase()));
const seen = new Set();
const unique = rows.filter((r) => !seen.has(r.email.toLowerCase()) && seen.add(r.email.toLowerCase()));
const due = [
  ...(a["no-followup"] ? [] : unique.filter((r) => log[r.email]?.first && !log[r.email].followup && daysSince(log[r.email].first) >= followupDays).map((r) => [r, "followup"])),
  ...unique.filter((r) => !log[r.email]).map((r) => [r, "first"]),
];
const batch = a.test ? due.slice(0, 2) : due.slice(0, Math.max(0, limit - sentToday));

console.log(`${list}: ${unique.length} people to contact, ${due.length} emails due, ${sentToday} already sent today (limit ${limit}).`);
console.log(a.test ? `Test: sending ${batch.length} sample emails to ${a.test} only.\n` : a.send ? `Sending ${batch.length} now.\n` : `Preview of ${batch.length}. Nothing is sent without --send.\n`);

for (const [i, [row, step]] of batch.entries()) {
  const kind = row.source === "courseit" && Number(row.learners) > 0 ? "courseit" : "cold";
  const { subject, text } = TEMPLATES[kind][step](row, me);
  const to = a.test || row.email;
  if (!a.send && !a.test) {
    console.log(`--- ${step} to ${row.email} (${row.channel})\nSubject: ${subject}\n\n${i < 2 ? text : text.split("\n").slice(0, 3).join("\n") + "\n[…]"}\n`);
    continue;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: replyTo, subject, text, headers: { "List-Unsubscribe": `<mailto:${replyTo}?subject=unsubscribe>` } }),
  });
  if (!res.ok) {
    console.error(`FAILED ${row.email}: ${res.status} ${(await res.text()).slice(0, 200)}`);
    if (res.status === 401 || res.status === 403 || res.status === 429) break; // key, domain or rate problem: stop, don't hammer
    continue;
  }
  console.log(`sent ${step.padEnd(8)} ${to}  (${row.channel})`);
  if (!a.test) {
    log[row.email] = { ...log[row.email], channel: row.channel, [step]: new Date().toISOString() };
    writeFileSync(LOG, JSON.stringify(log, null, 2)); // after every send, so a crash can't cause a repeat
  }
  if (i < batch.length - 1) await sleep(20_000 + Math.random() * 25_000); // spaced out like a person, not a blast
}
