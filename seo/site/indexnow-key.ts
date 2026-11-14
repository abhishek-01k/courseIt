// Serves the IndexNow key at /indexnow-key.txt, so search engines can check our pings are ours (keyLocation in
// seo/scripts/indexnow.mjs). The key is public by design; it lives in the INDEXNOW_KEY env var, not in the repo.
export function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(key, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
