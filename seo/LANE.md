# SEO lane

**Product:** CourseIt turns any YouTube video or playlist into a course you finish (lessons, notes, quizzes, placement
test, daily plan).
**Buyer:** self-learners who already learn from YouTube and keep not finishing: students (88% of visitors are in India,
71% on mobile, Vercel Analytics, 30 days to 10 Nov 2026), people switching careers, developers learning a new stack.
**Owner:** Siddesh (decisions that cost money or change positioning).

## Target

**Focus from 17 Nov 2026 (owner): grow non-brand search traffic, with the US as the priority market.**

Baseline from Search Console (screenshots, 17 Nov 2026). The property only has data from 13–15 Nov, so it's 3 days,
not 3 months:

| Metric | Baseline (13–15 Nov) | Target by 2027-02-14 | Source |
|---|---|---|---|
| Clicks | 362 | _owner_ | Search Console |
| Impressions | 640 | _owner_ | Search Console |
| CTR / avg position | 56.6% / 2.9 | n/a (brand-driven) | Search Console |
| Non-brand clicks | ~0: every top-10 query is "courseit" or a misspelling | _owner_ | `gsc.mjs clusters` |
| US impressions | 22 (3.4%); India 531 (83%) | _owner_ | `gsc.mjs perf --dim country` |
| US non-brand impressions | ~0 | _owner_ | `gsc.mjs clusters --country usa` |
| Course pages indexed | unknown (5 in sitemap) | _owner_ | `gsc.mjs inspect-sitemap` |
| Named by AI assistants (of 8) | _first run_ | _owner_ | [`ai-prompts.md`](ai-prompts.md) |
| Referring domains | _first pull_ | _owner_ | Search Console Links, Bing |

Suggested targets once 28 days of data exist (owner to confirm): US non-brand impressions/28d and the number of course
pages indexed are the two numbers that show this is working; clicks follow.

## Diagnosis (17 Nov 2026)

1. **Is Google indexing what we publish?** Unknown for course pages. Before 14 Nov there was no sitemap, and public
   course pages are only linked from the landing page, so Google can barely find them.
2. **Where do impressions come from?** All brand. Search sends people who already heard of CourseIt (Instagram reel,
   word of mouth); it finds us no new people yet.
3. **Close buyer queries?** None yet. **Page-1 with no clicks?** None. **Brand findable?** Yes, CTR 56.6%, but people
   misspell it (coursit, course it xyz, courseit.xy): entity work (Organization schema, same name everywhere) helps.
4. **Why the 420 course pages get nothing:** signed out, a course page showed only the title, channel and Day 1's lesson
   titles (the other days sit behind client-side tabs), every lesson link hit a sign-in wall, and there was no canonical,
   no structured data, and no noindex on failed courses. Fixed in the course-page PR (17 Nov).
5. **Why the audience is India:** the courses people built and the launch channel (Instagram) are Indian. US searchers
   need pages about what *they* study (CS50, freeCodeCamp, MIT OCW, Karpathy, 3Blue1Brown…) in English.

## Plan: US non-brand growth, 3–5 PRs a week

Ordered by expected impact per effort. Each line is one PR. Tick and date when merged.

- [x] **Course pages, all 420:** server-rendered summary + full outline + creator credit, Course structured data,
      canonical, "free course with notes & quizzes" titles, noindex on failed/unbuilt courses, lesson URLs out of
      robots, English courses first in the sitemap. _(PR, 17 Nov)_
- [ ] **Scale the course sitemap** 5 → 25 → 100 → all English, once URL Inspection shows each batch indexed. Then Hindi.
- [ ] **Public course directory** `/library` (or similar): every public English course grouped by topic, linked from the
      footer. Gives Google a crawl path to every course; lists are paged, no thin topic pages until a topic has 10+ courses.
- [ ] **Topic hub pages** for topics with 10+ English courses ("Learn Python from YouTube: N free structured courses"):
      unique intro, the courses ranked by learners, updated date. Batches of 5.
- [ ] **Organization + WebSite JSON-LD** on the home page (name, logo, sameAs) for the brand entity and misspellings.
- [ ] **Answer-first guides (US English)**, batch of 5: "How to finish a YouTube course", "CS50 study plan",
      "How to study Karpathy's Zero to Hero", "Turn a YouTube playlist into a course", "Free alternatives to
      Coursera for self-learners". Needs the `/guides` page type.
- [ ] **US seed courses** _(needs owner yes: costs AI and caption credits)_: build ~20 public courses from the playlists
      US learners search most, so the pages above have US-relevant content to rank.
- [ ] **Bing + IndexNow live** (owner keys), then ping on every PR.
- [ ] **Lesson pages** (later): a public, indexable lesson preview (summary + key points, notes stay behind sign-in)
      would multiply long-tail pages. Product decision first.

## How each run works

1. `git pull`. Re-read [`README.md`](README.md) (map), this file and [`NOTES.md`](NOTES.md).
2. Pull: `pnpm seo:gsc compare`, `perf`, `clusters`, `zero-click`; `inspect` every URL shipped in the last 14 days.
3. Pick 1–3 changes most likely to move the target, in the order in [`AGENT_PROMPT.md`](AGENT_PROMPT.md).
4. Ship on a branch, open a PR to `main`; after it deploys, `pnpm seo:indexnow <changed paths>`.
5. Log below: date, what shipped, why, numbers.
6. Report in under 200 words: on track / behind, what shipped, what's next. Start with `NEEDS OWNER:` if anything is
   blocked on a decision.

Cadence: 3–5 PRs a week from the plan above, each small enough to review in a few minutes.
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

### 2026-11-17: baseline, diagnosis, course pages

- Baseline from owner's Search Console screenshots (13–15 Nov): 362 clicks, 640 impressions, CTR 56.6%, position 2.9.
  All top-10 queries are the brand or misspellings. India 531 impressions, US 22, 30 countries.
- Owner focus: US audience; 3–5 PRs a week; SEO on all ~420 course pages.
- Shipped (one PR): every public course page now server-renders an "About this course" summary, the full lesson outline
  (titles, summaries, durations) and a credit linking the creator's YouTube channel, plus Course JSON-LD (syllabus,
  schedule, free offer), a canonical URL and a sharper title. Failed or unbuilt courses are noindex. robots.txt now
  blocks lesson URLs (sign-in walls) but keeps link-preview images fetchable. Sitemap batch now prefers English courses.
  `gsc.mjs` gained `--country usa`.
- Why: the template is the one change that improves all ~420 pages at once. The sitemap still grows in batches,
  because quality per page must be proven (indexed) before volume.
- Next: confirm the first 5 sitemap courses are indexed, then raise the batch; course directory page.
