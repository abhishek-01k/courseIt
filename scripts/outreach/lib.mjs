// Shared by the outreach scripts: CSV in and out, YouTube channel lookups, and pulling contacts out of a description.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const COLUMNS = ["channel_id", "channel", "name", "email", "subscribers", "videos", "country", "url", "instagram", "source", "courses", "learners", "top_course", "top_course_url"];

/** `--limit 20 --send` → { limit: "20", send: true } */
export function args() {
  const out = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const next = argv[i + 1];
    out[argv[i].slice(2)] = next === undefined || next.startsWith("--") ? true : argv[++i];
  }
  return out;
}

export function readCsv(path) {
  if (!existsSync(path)) return [];
  const table = [];
  let row = [], cell = "", quoted = false;
  const text = readFileSync(path, "utf8").replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') cell += '"', i++;
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") row.push(cell), (cell = "");
    else if (ch === "\n") row.push(cell), table.push(row), (row = []), (cell = "");
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) row.push(cell), table.push(row);
  const [head, ...rest] = table;
  return rest.filter((r) => r.some(Boolean)).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

export function writeCsv(path, rows) {
  mkdirSync(dirname(path), { recursive: true });
  const cell = (v) => (/[",\n\r]/.test(String(v ?? "")) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ""));
  writeFileSync(path, [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(","))].join("\n") + "\n");
}

/** Adds new rows to the list on disk. A creator already there keeps what you typed in by hand (name, email). */
export function mergeInto(path, fresh) {
  const byId = new Map(readCsv(path).map((r) => [r.channel_id, r]));
  let added = 0;
  for (const row of fresh) {
    const old = byId.get(row.channel_id);
    if (!old) added++;
    byId.set(row.channel_id, old ? { ...row, ...Object.fromEntries(Object.entries(old).filter(([, v]) => v !== "")) } : row);
  }
  const rows = [...byId.values()];
  writeCsv(path, rows);
  return { rows, added };
}

export async function youtube(path, params) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${new URLSearchParams(params)}`, { headers: { "X-Goog-Api-Key": key } });
  if (!res.ok) throw new Error(`YouTube ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

const NOT_AN_EMAIL = /\.(png|jpe?g|gif|webp|svg)$|^(example|email|name|you|your)@|@(example|email|domain)\./i;

/** The first contact email written in a channel description, if the creator put one there. */
export function findEmail(text) {
  const found = text.match(/[a-z0-9][a-z0-9._%+-]*@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}/gi) ?? [];
  return found.map((e) => e.replace(/\.$/, "").toLowerCase()).find((e) => !NOT_AN_EMAIL.test(e)) ?? "";
}

export const findInstagram = (text) => /instagram\.com\/([a-z0-9._]{2,30})/i.exec(text)?.[1]?.replace(/\.$/, "") ?? "";

/** Subscribers, description contacts and the rest for up to any number of channel ids (1 quota unit per 50). */
export async function channelDetails(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const data = await youtube("channels", { part: "snippet,statistics", id: ids.slice(i, i + 50).join(","), maxResults: "50" });
    for (const c of data.items ?? []) {
      const description = c.snippet?.description ?? "";
      out.push({
        channel_id: c.id,
        channel: c.snippet?.title ?? "",
        name: "",
        email: findEmail(description),
        subscribers: c.statistics?.hiddenSubscriberCount ? "" : Number(c.statistics?.subscriberCount ?? 0),
        videos: Number(c.statistics?.videoCount ?? 0),
        country: c.snippet?.country ?? "",
        url: c.snippet?.customUrl ? `https://www.youtube.com/${c.snippet.customUrl}` : `https://www.youtube.com/channel/${c.id}`,
        instagram: findInstagram(description),
      });
    }
  }
  return out;
}

export function report(path, rows, added) {
  const withEmail = rows.filter((r) => r.email).length;
  console.log(`\n${path}: ${rows.length} creators (${added} new), ${withEmail} with an email, ${rows.length - withEmail} to look up by hand.`);
}
