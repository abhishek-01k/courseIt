const clock = (s: number) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), Math.floor(s % 60)].map((n) => String(n).padStart(2, "0")).join(":");

type Chunk = { text: string; offset: number; duration: number };

/**
 * The video's existing captions from Supadata, as "[HH:MM:SS] text" lines,
 * or null when the video has none. Native captions only: 1 credit, returns in seconds at any video length.
 */
export async function fetchTranscript(videoId: string): Promise<string | null> {
  const params = new URLSearchParams({ url: `https://www.youtube.com/watch?v=${videoId}`, lang: "en", mode: "native", chunkSize: "600" });
  let res: Response;
  for (let attempt = 0; ; attempt++) {
    res = await fetch(`https://api.supadata.ai/v1/transcript?${params}`, {
      headers: { "x-api-key": process.env.SUPADATA_API_KEY ?? "" },
      cache: "no-store",
    });
    if (res.status !== 429) break;
    // Two kinds of 429: too many requests per second (wait and try again) and the plan's monthly credits used up
    // (no point waiting; fail now so it shows up). 59 builds died on the first kind in Nov 2026.
    const body = await res.text();
    if (!/rate limit/i.test(body) || attempt >= 6) throw new Error(`Supadata 429: ${body.slice(0, 300)}`);
    const wait = Number(res.headers.get("retry-after")) * 1000 || 1000 * 2 ** attempt;
    await new Promise((r) => setTimeout(r, Math.min(wait, 10_000)));
  }
  if (res.status === 206 || res.status === 404 || res.status === 403) return null; // no captions / not public
  if (!res.ok) throw new Error(`Supadata ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const data = (await res.json()) as { content?: Chunk[] };
  const chunks = Array.isArray(data.content) ? data.content : [];
  if (!chunks.length) return null;
  return chunks
    .filter((c) => typeof c.text === "string" && c.text.trim())
    .map((c) => `[${clock(c.offset / 1000)}] ${c.text.replace(/\s+/g, " ").trim()}`)
    .join("\n");
}

/**
 * Captions for many videos at once, paced to Supadata's rate limit (SUPADATA_RPS requests a second; default 1, safe on
 * every plan; Pro allows 10) so a long playlist isn't refused for going too fast. Returns each video's transcript, or
 * null when it has none. One video Supadata can't read (removed, private, a one-off error) is just left out; if most
 * fail, or the rate limit or credits still say no after retries, it throws rather than drop good videos silently.
 */
export async function fetchTranscripts(videoIds: string[]): Promise<Map<string, string | null>> {
  const rps = Math.max(1, Number(process.env.SUPADATA_RPS) || 1);
  const gap = 1000 / rps;
  let slot = Date.now();
  // Each request waits for its turn, so starts are never closer together than the plan allows.
  const turn = async () => {
    const at = Math.max(slot, Date.now());
    slot = at + gap;
    await new Promise((r) => setTimeout(r, at - Date.now()));
  };
  const parallel = Math.min(10, rps * 2);
  const out = new Map<string, string | null>();
  let next = 0;
  let failed = 0;
  let fatal: Error | null = null;
  const worker = async () => {
    while (next < videoIds.length && !fatal) {
      const id = videoIds[next++];
      await turn();
      try {
        out.set(id, await fetchTranscript(id));
      } catch (error) {
        if (/Supadata 429/.test((error as Error).message)) fatal = error as Error; // credits used up: stop spending
        failed++;
        out.set(id, null);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(parallel, videoIds.length) }, worker));
  if (fatal) throw fatal;
  if (videoIds.length && failed > videoIds.length / 2) throw new Error(`Supadata failed for ${failed} of ${videoIds.length} videos`);
  return out;
}
