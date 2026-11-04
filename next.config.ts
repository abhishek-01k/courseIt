import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Keep visited pages in the browser for 30s, so going back to a course is instant. Server actions
  // call refresh(), which drops this cache, so a change still shows right away.
  experimental: { staleTimes: { dynamic: 30 } },
  // Maintenance mode: MAINTENANCE_MODE=1 sends every page and API call to /maintenance (a 503 page).
  // Left through: Inngest, so courses already being built can finish; payment webhooks, so no plan change is
  // lost; and the files the page itself needs.
  // Read when the app builds, so on Vercel redeploy after changing it.
  async rewrites() {
    if (process.env.MAINTENANCE_MODE !== "1") return [];
    return { beforeFiles: [{ source: "/((?!api/inngest|api/webhooks|_next/|maintenance|icon\\.svg).*)", destination: "/maintenance" }], afterFiles: [], fallback: [] };
  },
  // Profile photos from the sign-in providers, plus YouTube thumbnails (served from i, i1–i9… .ytimg.com).
  // Keep in step with OPTIMIZED in src/components/thumbnail.tsx; other hosts still show, just unoptimized.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
      { protocol: "https", hostname: "**.twimg.com" },
      { protocol: "https", hostname: "**.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "**.ggpht.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
