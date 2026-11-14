# SEO lane

**Product:** CourseIt turns any YouTube video or playlist into a course you finish (lessons, notes, quizzes, placement
test, daily plan).
**Buyer:** self-learners who already learn from YouTube and keep not finishing: students (88% of visitors are in India,
71% on mobile, Vercel Analytics, 30 days to 10 Nov 2026), people switching careers, developers learning a new stack.
**Owner:** Siddesh (decisions that cost money or change positioning).

## Target

Not set yet: it needs a baseline. The first run with Search Console access pulls the baseline below, then proposes
numbers to the owner. Proposed shape (owner to confirm the numbers and the date):

| Metric | Baseline | Target by 2027-02-14 | Source |
|---|---|---|---|
| Impressions / 28 days | _first pull_ | _owner_ | Search Console, product host only |
| Clicks / 28 days | _first pull_ | _owner_ | Search Console |
| Average position | _first pull_ | _owner_ | Search Console |
| Buyer queries in top 10 (clusters "tool" + "learner problem") | _first pull_ | _owner_ | `gsc.mjs clusters` + `perf` |
| Sitemap URLs indexed / published | _first pull_ | 100% | `gsc.mjs inspect-sitemap` |
| AI-answer impressions | _first pull_ | _owner_ | Search Console, Generative AI report |
| Named by AI assistants (of 8 prompts) | _first run_ | _owner_ | [`ai-prompts.md`](ai-prompts.md) |
| Referring domains | _first pull_ | _owner_ | Search Console Links, Bing |
| Organic sign-ups | _not tracked yet_ | _owner_ | see NOTES: "how did you find us" |

Known before Search Console: 11,469 visitors and 63,140 page views in the 30 days to 10 Nov 2026 (Vercel); top
referrers were Google sign-in, Google search and Instagram (repo README). That's all traffic, not organic, so it's
context, not a baseline.

## Plan (first weeks), in playbook order

1. **Measure and diagnose.** Pull 3 months of queries and pages, answer the five questions in
   [`PLAYBOOK.md`](PLAYBOOK.md#measure-and-diagnose-first), write the answers here. Everything below gets reordered by
   what that finds.
2. **Get indexed.** Sitemap, robots and llms.txt are live with this lane's first PR. Next: submit the sitemap, set up
   Bing Webmaster Tools, ping IndexNow, inspect every sitemap URL, request indexing by hand for `/`, `/pricing`, `/about`.
3. **Course pages in batches.** Public course pages (`/courses/<slug>`) are the one page type we have hundreds of. They
   start in the sitemap as a batch of 5 (most-joined). Scale `COURSE_SITEMAP_LIMIT` in `config.ts` (5 → 10 → 25 → 50 …)
   only once URL Inspection shows the previous batch indexed. They're AI-written from captions, so watch for "Crawled,
   currently not indexed": that's Google calling them thin, and the fix is a better page, not more pages.
4. **Buyer-problem guides** (answer-first) for the "learner problem" and "tool" clusters, once step 1 shows what people
   search. Needs a `/guides` page type: a to-do for the website lane, see NOTES.
5. **Original data study** from data we already hold (e.g. which YouTube topics learners finish, where they drop off).
   Owner yes needed: it publishes aggregate usage data.
6. **Entity.** Same name and links everywhere; Organization schema on the home page; About already names a person.

## How each run works

1. `git pull`. Re-read [`README.md`](README.md) (map), this file and [`NOTES.md`](NOTES.md).
2. Pull: `pnpm seo:gsc compare`, `perf`, `clusters`, `zero-click`; `inspect` every URL shipped in the last 14 days.
3. Pick 1–3 changes most likely to move the target, in the order in [`AGENT_PROMPT.md`](AGENT_PROMPT.md).
4. Ship on a branch, open a PR to `main`; after it deploys, `pnpm seo:indexnow <changed paths>`.
5. Log below: date, what shipped, why, numbers.
6. Report in under 200 words: on track / behind, what shipped, what's next. Start with `NEEDS OWNER:` if anything is
   blocked on a decision.

Mondays: title/description pass on pages at positions 1–30, plus one log line with the week's numbers.
Weekly: AI prompt set, referring domains. Monthly: raise or hold the course batch; merge or improve pages with no
impressions after 6 weeks.

## Log

### 2026-11-14: setup

- Created this lane in `seo/` from the Organic Growth Playbook (Nov 2026).
- Shipped `/sitemap.xml` (6 static pages + first batch of 5 most-joined public courses), `/robots.txt` (app, admin, API
  disallowed), `/llms.txt`, and `/indexnow-key.txt`. Before this the site had no sitemap or robots.txt.
- Added `seo/scripts/gsc.mjs` (performance, compare, clusters, zero-click, URL inspection, sitemaps) and
  `seo/scripts/indexnow.mjs`. Neither has run against real data yet: no keys in this environment.
- Why: lever 1 (get indexed) and setup come before any content. No Search Console data yet, so no content changes.
- Blocked on owner: Search Console + IndexNow keys, Bing setup, targets. See NOTES.
