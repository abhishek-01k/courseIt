// One home for the SEO lane's settings. The route files in src/app (sitemap, robots, llms.txt, IndexNow key)
// only re-export from seo/site, so everything SEO lives in this folder.

/** The canonical host. Matches metadataBase in src/app/layout.tsx. */
export const SITE_URL = "https://www.courseit.xyz";

/** Public marketing pages, in the order we care about them. Add a page here when it ships. */
export const STATIC_PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/refunds", priority: 0.2, changeFrequency: "yearly" },
];

/**
 * How many public course pages go in the sitemap: the most-joined ready, public courses.
 * Playbook rule: ship a page type in batches of 5 and scale only once URL Inspection shows the batch is indexed.
 * Raise this in steps (5 → 10 → 25 → 50 …) and log each step in seo/LANE.md.
 */
export const COURSE_SITEMAP_LIMIT = 5;

/** Paths crawlers should skip: signed-in app screens, admin, API, build progress, maintenance. */
export const DISALLOWED_PATHS = ["/api/", "/admin", "/build/", "/dashboard", "/settings", "/inbox", "/notes", "/new", "/plans", "/support", "/login", "/maintenance"];
