import { headers } from "next/headers";
import { type Region, regionFor } from "@/lib/plans";

/**
 * The visitor's pricing region, from the country Vercel adds to every request. Locally there is no such header,
 * so DEV_COUNTRY (e.g. IN or GB) picks one; without it you get US prices. Reads request headers, so call it inside
 * <Suspense>.
 */
export async function currentRegion(): Promise<Region> {
  const country = (await headers()).get("x-vercel-ip-country") ?? (process.env.NODE_ENV === "production" ? null : process.env.DEV_COUNTRY);
  return regionFor(country?.toUpperCase());
}
