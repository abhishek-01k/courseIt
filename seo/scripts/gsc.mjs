#!/usr/bin/env node
// Search Console for the SEO lane. No dependencies: signs a service-account JWT with node:crypto.
//
// Env (never in the repo):
//   GSC_CREDENTIALS  service-account JSON, or a path to the .json file. Add the account's email as a user on the property.
//   GSC_PROPERTY     e.g. "sc-domain:courseit.xyz" or "https://www.courseit.xyz/"
//
// Commands (search data lags 2-3 days, so windows end 3 days ago):
//   node seo/scripts/gsc.mjs perf [--dim query|page|country|device] [--days 28] [--limit 50] [--min-pos 5 --max-pos 30]
//   node seo/scripts/gsc.mjs compare [--days 28]        this window vs the one before: clicks, impressions, CTR, position
//   node seo/scripts/gsc.mjs clusters [--days 90]       queries grouped by intent (rules in seo/clusters.json)
//   node seo/scripts/gsc.mjs zero-click [--days 28]     page-1 queries (position < 10) with 0 clicks: rewrite titles
//   node seo/scripts/gsc.mjs inspect <url> [<url> ...]  URL Inspection: indexed or not, and why
//   node seo/scripts/gsc.mjs inspect-sitemap            inspect every URL in the live sitemap
//   node seo/scripts/gsc.mjs sitemaps [--submit]        list sitemaps (or submit /sitemap.xml)
// Add --json to any command for raw output.

import { createSign } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://www.courseit.xyz";
// Only the product counts. Anything not on these hosts is dropped from page-level numbers so it can't flatter us.
const PRODUCT_HOSTS = new Set(["www.courseit.xyz", "courseit.xyz"]);
const HERE = dirname(fileURLToPath(import.meta.url));

const [cmd = "help", ...rest] = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith("--")) {
    const key = rest[i].slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith("--")) flags[key] = true;
    else flags[key] = rest[++i];
  } else positional.push(rest[i]);
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function credentials() {
  const raw = process.env.GSC_CREDENTIALS;
  if (!raw) die("GSC_CREDENTIALS is not set. See seo/README.md (Data access).");
  const json = raw.trim().startsWith("{") ? raw : existsSync(raw) ? readFileSync(raw, "utf8") : die(`GSC_CREDENTIALS: no file at ${raw}`);
  return JSON.parse(json);
}

function property() {
  const p = process.env.GSC_PROPERTY;
  if (!p) die('GSC_PROPERTY is not set, e.g. "sc-domain:courseit.xyz".');
  return p;
}

const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

let tokenCache;
async function token() {
  if (tokenCache) return tokenCache;
  const { client_email, private_key } = credentials();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: client_email, scope: "https://www.googleapis.com/auth/webmasters", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }),
  );
  const signature = b64url(createSign("RSA-SHA256").update(`${header}.${claims}`).sign(private_key));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${signature}` }),
  });
  const body = await res.json();
  if (!res.ok) die(`Google auth failed: ${JSON.stringify(body)}`);
  return (tokenCache = body.access_token);
}

async function api(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json", ...init.headers } });
  const text = await res.text();
  if (!res.ok) die(`${res.status} ${url}\n${text}`);
  return text ? JSON.parse(text) : {};
}

const siteParam = () => encodeURIComponent(property());

/** [start, end] as YYYY-MM-DD, ending 3 days ago (data lag), `days` long, shifted back `offset` windows. */
function window(days, offset = 0) {
  const end = new Date(Date.now() - (3 + offset * days) * 864e5);
  const start = new Date(end.getTime() - (days - 1) * 864e5);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return [fmt(start), fmt(end)];
}

async function query({ days = 28, offset = 0, dimensions = ["query"], rowLimit = 25000 }) {
  const [startDate, endDate] = window(days, offset);
  const out = await api(`https://www.googleapis.com/webmasters/v3/sites/${siteParam()}/searchAnalytics/query`, {
    method: "POST",
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit, dataState: "final" }),
  });
  let rows = out.rows ?? [];
  const pageIdx = dimensions.indexOf("page");
  if (pageIdx >= 0) rows = rows.filter((r) => PRODUCT_HOSTS.has(new URL(r.keys[pageIdx]).host));
  return { startDate, endDate, rows };
}

const pct = (n) => `${(n * 100).toFixed(1)}%`;
const pos = (n) => n.toFixed(1);

function table(rows, cols) {
  if (flags.json) return console.log(JSON.stringify(rows, null, 2));
  const widths = cols.map(([h, f]) => Math.min(70, Math.max(h.length, ...rows.map((r) => String(f(r)).length))));
  const line = (cells) => cells.map((c, i) => String(c).slice(0, widths[i]).padEnd(widths[i])).join("  ");
  console.log(line(cols.map(([h]) => h)));
  for (const r of rows) console.log(line(cols.map(([, f]) => f(r))));
}

function totals(rows) {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const position = impressions ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / impressions : 0;
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position };
}

async function liveSitemapUrls() {
  const res = await fetch(`${SITE_URL}/sitemap.xml`);
  if (!res.ok) die(`Couldn't fetch ${SITE_URL}/sitemap.xml: ${res.status}`);
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function inspect(urls) {
  const results = [];
  for (const url of urls) {
    const out = await api("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      body: JSON.stringify({ inspectionUrl: url, siteUrl: property() }),
    });
    const r = out.inspectionResult?.indexStatusResult ?? {};
    results.push({ url, verdict: r.verdict, coverage: r.coverageState, lastCrawl: r.lastCrawlTime?.slice(0, 10) ?? "-", canonical: r.googleCanonical ?? "-" });
  }
  table(results, [
    ["url", (r) => r.url.replace(SITE_URL, "") || "/"],
    ["verdict", (r) => r.verdict],
    ["coverage", (r) => r.coverage],
    ["last crawl", (r) => r.lastCrawl],
  ]);
}

const commands = {
  async perf() {
    const dim = flags.dim ?? "query";
    const { startDate, endDate, rows } = await query({ days: Number(flags.days ?? 28), dimensions: [dim] });
    let list = rows;
    if (flags["min-pos"]) list = list.filter((r) => r.position >= Number(flags["min-pos"]));
    if (flags["max-pos"]) list = list.filter((r) => r.position <= Number(flags["max-pos"]));
    list = list.sort((a, b) => b.impressions - a.impressions).slice(0, Number(flags.limit ?? 50));
    if (!flags.json) console.log(`${startDate} → ${endDate}, by ${dim}\n`);
    table(list, [
      [dim, (r) => r.keys[0].replace(SITE_URL, "") || "/"],
      ["clicks", (r) => r.clicks],
      ["impr", (r) => r.impressions],
      ["ctr", (r) => pct(r.ctr)],
      ["pos", (r) => pos(r.position)],
    ]);
  },

  async compare() {
    const days = Number(flags.days ?? 28);
    // By page, so non-product hosts are excluded from the totals.
    const [now, before] = await Promise.all([query({ days, dimensions: ["page"] }), query({ days, offset: 1, dimensions: ["page"] })]);
    const a = totals(now.rows);
    const b = totals(before.rows);
    const rows = [
      { metric: "clicks", now: a.clicks, before: b.clicks },
      { metric: "impressions", now: a.impressions, before: b.impressions },
      { metric: "ctr", now: pct(a.ctr), before: pct(b.ctr) },
      { metric: "avg position", now: pos(a.position), before: pos(b.position) },
    ];
    if (!flags.json) console.log(`now ${now.startDate} → ${now.endDate} vs before ${before.startDate} → ${before.endDate}\n`);
    table(rows, [
      ["metric", (r) => r.metric],
      ["now", (r) => r.now],
      ["before", (r) => r.before],
    ]);
  },

  async clusters() {
    const rules = JSON.parse(readFileSync(join(HERE, "..", "clusters.json"), "utf8")).clusters;
    const { startDate, endDate, rows } = await query({ days: Number(flags.days ?? 90), dimensions: ["query"] });
    const groups = new Map();
    for (const r of rows) {
      const q = r.keys[0].toLowerCase();
      const name = rules.find((c) => c.patterns.some((p) => new RegExp(p, "i").test(q)))?.name ?? "other";
      const g = groups.get(name) ?? { name, queries: 0, clicks: 0, impressions: 0, wpos: 0, top: [] };
      g.queries++;
      g.clicks += r.clicks;
      g.impressions += r.impressions;
      g.wpos += r.position * r.impressions;
      g.top.push(r);
      groups.set(name, g);
    }
    const list = [...groups.values()].sort((a, b) => b.impressions - a.impressions);
    const all = list.reduce((s, g) => s + g.impressions, 0) || 1;
    if (!flags.json) console.log(`${startDate} → ${endDate}, queries grouped by seo/clusters.json\n`);
    table(list, [
      ["cluster", (g) => g.name],
      ["queries", (g) => g.queries],
      ["clicks", (g) => g.clicks],
      ["impr", (g) => g.impressions],
      ["share", (g) => pct(g.impressions / all)],
      ["pos", (g) => pos(g.impressions ? g.wpos / g.impressions : 0)],
      ["top query", (g) => g.top.sort((a, b) => b.impressions - a.impressions)[0].keys[0]],
    ]);
  },

  async "zero-click"() {
    const { startDate, endDate, rows } = await query({ days: Number(flags.days ?? 28), dimensions: ["query", "page"] });
    const list = rows.filter((r) => r.position < 10 && r.clicks === 0).sort((a, b) => b.impressions - a.impressions);
    if (!flags.json) console.log(`${startDate} → ${endDate}: page-1 queries with no clicks\n`);
    table(list, [
      ["query", (r) => r.keys[0]],
      ["page", (r) => r.keys[1].replace(SITE_URL, "") || "/"],
      ["impr", (r) => r.impressions],
      ["pos", (r) => pos(r.position)],
    ]);
  },

  async inspect() {
    if (!positional.length) die("Usage: gsc.mjs inspect <url> [<url> ...]");
    await inspect(positional.map((u) => (u.startsWith("http") ? u : `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`)));
  },

  async "inspect-sitemap"() {
    await inspect(await liveSitemapUrls());
  },

  async sitemaps() {
    const base = `https://www.googleapis.com/webmasters/v3/sites/${siteParam()}/sitemaps`;
    if (flags.submit) {
      await api(`${base}/${encodeURIComponent(`${SITE_URL}/sitemap.xml`)}`, { method: "PUT" });
      console.log(`Submitted ${SITE_URL}/sitemap.xml`);
    }
    const out = await api(base);
    table(out.sitemap ?? [], [
      ["path", (s) => s.path],
      ["last read", (s) => s.lastDownloaded?.slice(0, 10) ?? "-"],
      ["errors", (s) => s.errors ?? 0],
      ["warnings", (s) => s.warnings ?? 0],
      ["submitted", (s) => s.contents?.map((c) => c.submitted).join("/") ?? "-"],
    ]);
  },

  help() {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 18).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  },
};

if (!commands[cmd]) die(`Unknown command "${cmd}". Run: node seo/scripts/gsc.mjs help`);
await commands[cmd]();
