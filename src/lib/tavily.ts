export type Reading = { title: string; url: string };

/**
 * Tavily web search: a few articles or docs that teach a lesson's topic, for "Further reading" under its
 * notes. Optional extra: no key, a slow answer or an error returns [] and the lesson is written anyway.
 */
export async function findReading(query: string): Promise<Reading[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.slice(0, 380), search_depth: "basic", max_results: 3, exclude_domains: ["youtube.com", "youtu.be"] }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Tavily ${res.status}: ${(await res.text()).slice(0, 200)}`);
    // Anything odd in the answer is skipped, never thrown: the lesson page renders these links as they are.
    const results: unknown = ((await res.json()) as { results?: unknown } | null)?.results;
    if (!Array.isArray(results)) return [];
    return results
      .map((r) => ({ title: typeof r?.title === "string" ? r.title.trim().slice(0, 200) : "", url: typeof r?.url === "string" ? r.url : "" }))
      .filter((r) => r.title && URL.canParse(r.url) && /^https?:$/.test(new URL(r.url).protocol)) // real web links only, never javascript: etc.
      .slice(0, 3);
  } catch (error) {
    console.error(error);
    return [];
  }
}
