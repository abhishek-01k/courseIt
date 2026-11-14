# seo/ — the SEO lane for CourseIt

Everything for growing CourseIt's organic visibility in Google and in AI answers (ChatGPT, Gemini, Perplexity, Google AI
Overviews) lives in this folder. The rest of the codebase only has four one-line route files that re-export from here.

## Map (HQ): where each fact lives

| Fact | Home |
|---|---|
| The method: levers, cadence, guardrails | [`PLAYBOOK.md`](PLAYBOOK.md) |
| Target, baseline, current plan, dated log of what shipped | [`LANE.md`](LANE.md) |
| To-dos for the owner and for other lanes | [`NOTES.md`](NOTES.md) |
| The agent's standing instructions (paste into the scheduled run) | [`AGENT_PROMPT.md`](AGENT_PROMPT.md) |
| Weekly AI-answer check: fixed prompts | [`ai-prompts.md`](ai-prompts.md) |
| Query clusters (brand, tool, problem, topic) | [`clusters.json`](clusters.json) |
| Site URL, static pages, sitemap batch size, robots rules | [`config.ts`](config.ts) |
| Product facts and voice | the repo [`README.md`](../README.md) and the live site. Never invent facts here. |

If two files disagree, the home in this table wins. Fix the other one.

## What ships to the site

| URL | Source | Wired up by |
|---|---|---|
| `/sitemap.xml` | [`site/sitemap.ts`](site/sitemap.ts): static pages + the current batch of most-joined public courses | `src/app/sitemap.ts` |
| `/robots.txt` | [`site/robots.ts`](site/robots.ts): app, admin and API paths disallowed; points to the sitemap | `src/app/robots.ts` |
| `/llms.txt` | [`site/llms.ts`](site/llms.ts): plain-markdown summary for AI assistants | `src/app/llms.txt/route.ts` |
| `/indexnow-key.txt` | [`site/indexnow-key.ts`](site/indexnow-key.ts): serves `INDEXNOW_KEY` (404 until it's set) | `src/app/indexnow-key.txt/route.ts` |

These regenerate on every deploy: Vercel builds on push, so there's no separate build step for SEO.

## Data access (keys live in env, never in the repo)

| Env var | What | How to get it |
|---|---|---|
| `GSC_CREDENTIALS` | Google service-account JSON (or a path to it) | Google Cloud → IAM → Service accounts → create → Keys → JSON. Enable the *Google Search Console API*. Then Search Console → Settings → Users → add the account's email (Full for sitemap submit, Restricted to read). |
| `GSC_PROPERTY` | The Search Console property | `sc-domain:courseit.xyz` for a domain property, or `https://www.courseit.xyz/` for a URL-prefix one |
| `INDEXNOW_KEY` | IndexNow key (public by design) | `node -e "console.log(crypto.randomUUID())"`. Set it on Vercel **and** where the agent runs. |

Bing Webmaster Tools has no key here: set it up once by importing from Search Console (see `NOTES.md`).

## Commands

```bash
pnpm seo:gsc compare                      # last 28 days vs the 28 before
pnpm seo:gsc perf --dim query --limit 50  # top queries
pnpm seo:gsc perf --min-pos 5 --max-pos 30  # close queries: refresh these first
pnpm seo:gsc zero-click                   # page-1 results with no clicks: fix titles
pnpm seo:gsc clusters --days 90           # impressions by intent
pnpm seo:gsc inspect-sitemap              # is every sitemap URL indexed?
pnpm seo:gsc inspect /pricing             # one URL
pnpm seo:gsc sitemaps --submit            # submit /sitemap.xml
pnpm seo:indexnow                         # ping every sitemap URL after a deploy
pnpm seo:indexnow /pricing /about         # or just the pages that changed
```

Search data lags 2–3 days, so every window ends 3 days ago.
