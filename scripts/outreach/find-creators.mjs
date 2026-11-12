// Finds YouTube teachers of the right size who aren't on CourseIt yet, and the contact email in their channel
// description when they wrote one. Adds to outreach/creators.csv, so run it again (other topics, another day) to grow the list.
//   node --env-file=.env.local scripts/outreach/find-creators.mjs [--min 20000] [--max 150000] [--region IN] [--searches 40] [--queries my-topics.txt]
// Quota: each search is 100 units of the YouTube API's 10,000 a day, the same quota course builds use.
import { readFileSync } from "node:fs";
import { args, channelDetails, mergeInto, report, youtube } from "./lib.mjs";

// What CourseIt's learners study (src/lib/course-tags.ts). One line per search; --queries swaps in your own file.
const TOPICS = [
  "python full course", "javascript tutorial for beginners", "react js course", "dsa in java playlist", "c++ complete course",
  "system design course", "sql tutorial playlist", "machine learning course", "deep learning lectures", "data analytics full course",
  "devops tutorial", "aws course for beginners", "operating systems lectures", "dbms lectures", "computer networks playlist",
  "jee physics one shot", "neet biology lectures", "class 12 maths chapter wise", "gate cse lectures", "upsc polity lectures",
  "calculus full course", "linear algebra lectures", "statistics for data science", "organic chemistry lectures", "engineering mathematics playlist",
  "digital marketing full course", "stock market course for beginners", "accounting basics lectures", "ca foundation lectures", "excel full course",
  "figma ui ux course", "graphic design course", "interview preparation playlist", "aptitude for placements", "english speaking course",
  "flutter course", "android development course", "cyber security full course", "power bi tutorial", "node js backend course",
];

const a = args();
const min = Number(a.min ?? 20_000);
const max = Number(a.max ?? 150_000);
const searches = Number(a.searches ?? 40);
const topics = a.queries ? readFileSync(a.queries, "utf8").split("\n").map((l) => l.trim()).filter(Boolean) : TOPICS;
const out = a.out ?? "outreach/creators.csv";

const ids = new Set();
let used = 0;
// Playlists first: someone who publishes a playlist on a topic is teaching a course already.
search: for (const type of ["playlist", "channel"]) {
  for (const q of topics) {
    if (used >= searches) break search;
    try {
      const data = await youtube("search", { part: "snippet", type, q, maxResults: "50", ...(a.region ? { regionCode: a.region } : {}) });
      for (const item of data.items ?? []) if (item.snippet?.channelId) ids.add(item.snippet.channelId);
      used++;
      console.log(`${String(used).padStart(3)}  ${type.padEnd(8)} ${q}  → ${ids.size} channels so far`);
    } catch (error) {
      console.error(String(error.message ?? error));
      break search; // almost always the day's quota: keep what we have
    }
  }
}

const fit = (await channelDetails([...ids]))
  .filter((c) => c.subscribers !== "" && c.subscribers >= min && c.subscribers <= max && c.videos >= 15)
  .map((c) => ({ ...c, source: "search" }))
  .sort((x, y) => Boolean(y.email) - Boolean(x.email) || y.subscribers - x.subscribers);

const { rows, added } = mergeInto(out, fit);
console.log(`\n${ids.size} channels found, ${fit.length} between ${min.toLocaleString()} and ${max.toLocaleString()} subscribers.`);
report(out, rows, added);
