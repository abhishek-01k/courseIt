// The page every visitor sees while MAINTENANCE_MODE=1 (see the rewrite in next.config.ts).
// A route, not a page, so it can answer 503: search engines treat that as "back soon" and keep the site indexed.
// Plain HTML with its own styles, so it never touches the database, sign-in, or any paid API.
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>CourseIt · Back soon</title>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<style>
  :root { --paper: #fcfcfa; --ink: #0f1611; --ink-soft: #4c4c3d; --moss: #4b5e1e; --lime-soft: #e4e9c6; }
  @media (prefers-color-scheme: dark) {
    :root { --paper: #0e1311; --ink: #f1f3ea; --ink-soft: #b3b7a3; --moss: #b8c460; --lime-soft: #283117; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px 16px;
         background: var(--paper); color: var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
  main { max-width: 520px; text-align: center; }
  .tag { display: inline-block; padding: 4px 12px; border-radius: 999px; background: var(--lime-soft); color: var(--moss);
         font: 500 12px/1.6 ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
  h1 { margin: 16px 0 12px; font-size: clamp(1.9rem, 5vw, 2.6rem); line-height: 1.1; font-weight: 500; }
  em { color: var(--moss); }
  p { margin: 0; color: var(--ink-soft); line-height: 1.6; }
</style>
</head>
<body>
<main>
  <span class="tag">Maintenance</span>
  <h1>CourseIt is <em>taking a breather.</em></h1>
  <p>So many of you showed up that we're making room for everyone. Your courses and progress are safe. Check back soon.</p>
</main>
</body>
</html>`;

export function GET() {
  return new Response(html, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "3600", "Cache-Control": "no-store" },
  });
}

export const POST = GET; // server actions and forms posted while the site is down get the same page
