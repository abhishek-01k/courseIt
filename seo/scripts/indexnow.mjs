#!/usr/bin/env node
// Ping IndexNow (Bing, Yandex, Seznam, Naver…; Bing feeds ChatGPT search) after a deploy, so changed pages get recrawled fast.
//
// Env: INDEXNOW_KEY: 8-128 letters, digits or dashes. The same value must be set on Vercel, where the site serves it at
//      /indexnow-key.txt (seo/site/indexnow-key.ts). Generate one with: node -e "console.log(crypto.randomUUID())"
//
//   node seo/scripts/indexnow.mjs                 every URL in the live sitemap
//   node seo/scripts/indexnow.mjs /pricing /about  just these paths (or full URLs)
//   add --dry-run to print the payload without sending it

const SITE_URL = "https://www.courseit.xyz";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const paths = args.filter((a) => !a.startsWith("--"));

const key = process.env.INDEXNOW_KEY;
if (!key && !dryRun) {
  console.error("INDEXNOW_KEY is not set. See seo/README.md (Data access).");
  process.exit(1);
}

async function sitemapUrls() {
  const res = await fetch(`${SITE_URL}/sitemap.xml`);
  if (!res.ok) throw new Error(`Couldn't fetch the sitemap: ${res.status}`);
  return [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const urlList = paths.length ? paths.map((p) => (p.startsWith("http") ? p : `${SITE_URL}${p.startsWith("/") ? "" : "/"}${p}`)) : await sitemapUrls();
const body = { host: new URL(SITE_URL).host, key: key ?? "<INDEXNOW_KEY>", keyLocation: `${SITE_URL}/indexnow-key.txt`, urlList };

if (dryRun) {
  console.log(JSON.stringify(body, null, 2));
  process.exit(0);
}

// Before pinging, make sure the live site serves the same key, or every ping is rejected.
const live = await fetch(body.keyLocation).then((r) => (r.ok ? r.text() : null));
if (live?.trim() !== key) {
  console.error(`${body.keyLocation} doesn't serve INDEXNOW_KEY yet. Set INDEXNOW_KEY on Vercel and redeploy first.`);
  process.exit(1);
}

const res = await fetch("https://api.indexnow.org/indexnow", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(body) });
// 200 = received, 202 = accepted, key check pending. Anything else is a problem.
console.log(`IndexNow: ${res.status} for ${urlList.length} URL(s)`);
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
