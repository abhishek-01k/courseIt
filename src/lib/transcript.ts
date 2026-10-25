const clock = (s: number) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), Math.floor(s % 60)].map((n) => String(n).padStart(2, "0")).join(":");

type Chunk = { text: string; offset: number; duration: number };

/**
 * The video's existing captions from Supadata, as "[HH:MM:SS] text" lines (the same shape Gemini writes),
 * or null when the video has none. Native captions only: 1 credit, returns in seconds at any video length.
 */
export async function fetchTranscript(videoId: string): Promise<string | null> {
  const params = new URLSearchParams({ url: `https://www.youtube.com/watch?v=${videoId}`, lang: "en", mode: "native", chunkSize: "600" });
  const res = await fetch(`https://api.supadata.ai/v1/transcript?${params}`, {
    headers: { "x-api-key": process.env.SUPADATA_API_KEY ?? "" },
    cache: "no-store",
  });
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
