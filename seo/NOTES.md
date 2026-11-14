# Notes and to-dos

One line per to-do, newest first in each section. Tick it and add the date when it's done. A lane never edits another
lane's files: it adds a line here instead.

## Owner (Siddesh)

- [ ] **Search Console API access.** Create a service account, enable the Search Console API, add its email as a user on the
      courseit.xyz property, and put the JSON in `GSC_CREDENTIALS` plus the property in `GSC_PROPERTY` where the agent runs.
      _Recommendation: a domain property (`sc-domain:courseit.xyz`), Full permission so the agent can submit sitemaps._
- [ ] **IndexNow key.** Generate one (`node -e "console.log(crypto.randomUUID())"`), set `INDEXNOW_KEY` on Vercel (Production)
      and in the agent's environment, redeploy. Free.
- [ ] **Bing Webmaster Tools.** Sign in at bing.com/webmasters, import the site from Search Console, submit
      `https://www.courseit.xyz/sitemap.xml`. Bing feeds ChatGPT search. Free, ~5 minutes.
- [ ] **Request indexing by hand** in Search Console for `/`, `/pricing`, `/about` once the sitemap PR is live.
- [ ] **Confirm targets** in `LANE.md` after the first data pull (the agent will propose numbers).
- [ ] **Daily scheduled run.** Schedule `AGENT_PROMPT.md` to run daily once the keys above exist; before that, runs have
      nothing to measure.
- [ ] **Original data study (later).** OK to publish aggregate, anonymous usage numbers (e.g. completion by topic)? It's a
      positioning call.

## Website lane

- [ ] Add a `/guides` page type rendering answer-first guides from JSON in `seo/content/guides/` (title, description,
      answer, body, sources, updated date). Link `/guides` from the footer. SEO lane writes the content.
- [ ] Organization + WebSite JSON-LD on the home page (name, logo, url, sameAs = the social links in `src/lib/constants.ts`).
- [ ] Course pages: canonical URL (`alternates.canonical`) and a visible "updated" date; consider `Course` schema matching the
      visible content.
- [ ] Ask every new sign-up "How did you find us?" (onboarding, one optional select incl. "Google search" and "ChatGPT /
      AI assistant") so organic sign-ups can be counted.

## Outreach lane

- [ ] Free directory profiles (Product Hunt, AlternativeTo, Futurepedia-type AI tool lists, There's An AI For That),
      same name, description and link everywhere.
- [ ] "Built with CourseIt" / featured-creator note that creators can link to (badges for anyone we feature).
