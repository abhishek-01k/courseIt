import type { MetadataRoute } from "next";
import { ALLOWED_PATHS, DISALLOWED_PATHS, SITE_URL } from "../config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", ...ALLOWED_PATHS], disallow: DISALLOWED_PATHS }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
