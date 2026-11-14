# Organic Growth Playbook (SEO + AI answers)

Nov 14, 2026 · Siddesh. The method this lane follows. CourseIt-specific choices live in [`LANE.md`](LANE.md); the
filled-in agent prompt is [`AGENT_PROMPT.md`](AGENT_PROMPT.md).

## What this is

A repeatable system for growing a small product's organic visibility in Google and in AI answers (ChatGPT, Gemini,
Perplexity, Google AI Overviews), run day to day by an AI agent with a human owner who makes the calls that cost money
or change positioning.

It is distilled from a live run for a small web studio (Nov 2026). It works for any product whose buyers search for
their problem before they search for a vendor: services, SaaS, local businesses, tools.

The core idea: **measure from real search data, ship small changes every day, and only scale what Google actually indexes.**

## Goals and numbers to track

Set one number per outcome, a baseline on day one, and a deadline. Report on track or behind every run.

| Metric | Source | Why it matters |
|---|---|---|
| Impressions per 28 days | Search Console | Reach: are we being shown at all |
| Clicks per 28 days | Search Console | Real visits from search |
| Average position | Search Console | Distance from page 1 |
| Buyer-intent queries in the top 10 | Search Console, query view | The searches that turn into customers |
| Pages indexed vs published | URL Inspection | The bottleneck for new sites |
| AI-answer impressions | Search Console, Generative AI report | Visibility inside AI Overviews and AI Mode |
| Named by AI assistants | A fixed prompt set, run weekly | ChatGPT and Perplexity mentions |
| Referring domains | Search Console Links, Bing | Authority, which drives crawling |
| Organic enquiries | Ask every lead "how did you find us" | The only number that pays |

Exclude anything that isn't the product (client sites, subdomains) from the numbers, or they will flatter you.

Use visitor analytics (e.g. Cloudflare Web Analytics) for speed scores and referrers, not for counting people:
server-side request counts are mostly bots and scanners, and new domains attract scanner traffic.

## Setup

One afternoon of setup makes the daily runs cheap.

1. **A repo that deploys on push.** Site source, content sources (one JSON per guide or list), and a build script that
   regenerates pages, the sitemap and llms.txt in one command.
2. **Lanes.** One agent chat per job (SEO, website and tools, outreach, leads), each owning specific files. A lane never
   edits another lane's files; it leaves a one-line to-do in a shared NOTES file instead.
3. **One home per fact.** A map file (HQ) says where each fact lives: goals, voice, plan, log. Everything else links to
   it. This stops agents drifting apart.
4. **A lane file for SEO** holding: target, baseline, playbook, how each run works, and a dated log of what shipped and why.
5. **Data access for the agent:** Search Console API (performance, compare, URL inspection, sitemaps), IndexNow key,
   read-only web analytics, and a places/data API for list pages. Keys live in the environment, never in the repo.
6. **A scheduled run** (daily) that tells the agent: pull, re-read the map and lane file, work the playbook, report.
7. **An escalation path.** A shared to-do board. Anything that needs money or a positioning decision becomes a to-do for
   the owner plus a "NEEDS OWNER: question + recommendation" first line in the run summary.

## Measure and diagnose first

Before writing anything, pull 3 months of queries and pages and answer five questions. Each answer points at a lever.

| Question | How to check | If the answer is bad |
|---|---|---|
| Is Google indexing what we publish? | URL Inspection on each new page type | Stop scaling that type; earn links and internal links first |
| Where do impressions come from? | Group queries into clusters (tools, buyer problems, brand, AI) | Move effort to clusters that match buyers |
| Which buyer queries are close? | Queries at positions 5-30 with impressions | Refresh those pages first: cheapest wins |
| Do page-1 results get clicks? | Queries at position under 10 with 0 clicks | Rewrite title and description to promise the answer |
| Can people find the brand? | Brand name and misspellings in queries | About page, consistent name and links (entity) |

What this found in the live run: lists were "discovered, not indexed" three weeks after launch while guides were indexed
within a day; two thirds of impressions came from low-intent calculators; the closest buyer query sat at position 17; a
page-1 result had zero clicks; and people searched misspellings of the brand. That reordered the whole plan.

## The 8 growth levers

Run them in parallel, but in this order of priority for a new site.

1. **Get indexed before scaling.** Sitemap regenerated on every build, IndexNow pinged on every push, Bing Webmaster
   Tools set up (Bing feeds ChatGPT search), "Request indexing" by hand for key pages, a link from the homepage to each
   hub. Ship new page types in batches of 5; scale only once a batch is indexed.
2. **Earn authority.** Crawling follows links. Badges for anyone you feature, a "built by" credit on client work, free
   directory profiles, tool listings on resource pages, answers to journalist requests.
3. **Buyer-problem guides.** One cluster around the problem your buyer has ("my website isn't getting enquiries", "how
   much does X cost"). Answer in the first 40 words, one sourced fact beats three vague ones, a visible updated date, 2-4
   internal links. These are what AI answers quote.
4. **Data-driven list pages.** "The 10 best X in Y, ranked by Google reviews": one data pull per page, a fixed scoring
   formula, every entry written from the business's own site on the day. Each page has unique data, so it is not a
   doorway page. Skip a city if 10 solid entries don't exist.
5. **Original data study.** Aggregate stats from data you already hold (e.g. how many local businesses have online
   booking). Journalists and AI answers cite numbers nobody else has.
6. **Free tools as link magnets.** Pick tools your buyer uses, not generic calculators owned by government or SaaS
   sites. Each ends with one soft next step.
7. **CTR and refresh.** Weekly: pages at positions 1-30 get sharper titles and descriptions; pages with no impressions
   after 6 weeks get merged or improved.
8. **Technical and entity.** Fast pages (check Core Web Vitals by URL), valid schema matching visible content, an About
   page with a named person, the same name and links everywhere.

## Daily and weekly cadence

Small changes every day beat a big push once a month: search data lags 2-3 days, so a daily loop keeps learning while it
ships. On slow days (data still lagging, pages waiting to be indexed) the run drafts guides, directory profiles or forum
answers instead of churning pages.

- **Mondays:** title and description pass on pages at positions 1-30; one log line with the week's numbers.
- **Weekly:** run the fixed AI prompt set; count referring domains.
- **Monthly:** re-pull list data and refresh review counts; merge or improve pages with no impressions after 6 weeks.

## Guardrails

These protect the whole domain. Quality per page, volume across pages.

- No scaled near-identical pages and no doorway pages (city or trade swapped, nothing else changed). Google's spam
  policies name both.
- No invented facts, statistics or quotes. A number needs a primary source linked inline, or it is framed as a rule of thumb.
- No promises about rankings or what an AI will say.
- No paid links, no fake reviews, no sock-puppet forum posts.
- Dates change only when content changes.
- Data stays honest: the "as of" date is when the data was pulled, not when the page shipped.
- The agent never spends money, emails anyone or changes positioning without the owner's yes.

## Lessons learned

- **Check indexing before scaling a page type.** We planned 100 list pages before noticing Google hadn't indexed the first three.
- **Impressions from tools flatter you.** Two thirds of impressions came from calculators with zero clicks and zero buyers.
- **Your lead data is the wrong shape for "best of" lists.** Sales leads are weak businesses; top-10 lists need the
  strongest. Pull list data separately (about $0.12 per list).
- **Data pulls need a sanity check.** A "Bar Harbor" query returned New York cruises; one city had 3 branches of one
  chain. Read every entry before publishing.
- **Don't call traffic "bots" or "people" too fast.** Look at referrer, path and browser first, and line the spike up
  against what changed that day (new domains, a Google core update).
- **The agent should pull its own data.** Screenshots are slower and get misread; the API answers the next question too.
- **Answer-first guides get into AI answers early**, even at positions 20-50. They are the cheapest AEO lever.
- **Core updates scramble a week or two of data.** Note the dates and judge after the rollout ends.
