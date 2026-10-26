// Readable, shareable URLs: /courses/deep-dive-into-llms-like-chatgpt-k7x2/3 (lesson 3).
// The 4-character code keeps two courses with the same title apart. IDs stay inside the database.

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no 0/o, 1/l/i lookalikes

export function newSlug(title: string) {
  let words = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (words.length > 60) words = words.slice(0, 60).replace(/-[^-]*$/, ""); // don't cut a word in half
  const code = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${words || "course"}-${code}`;
}

export const coursePath = (slug: string) => `/courses/${slug}`;
/** Lessons are addressed by number (1-based). Safe because a course's lessons are never reordered. */
export const lessonPath = (slug: string, position: number) => `/courses/${slug}/${position + 1}`;
/** The full-screen onboarding shown while a course builds. */
export const buildPath = (slug: string) => `/build/${slug}`;
export const roadmapPath = (slug: string) => `/roadmaps/${slug}`;
/** Sign in, then come back here. */
export const loginPath = (next: string) => `/login?callbackUrl=${encodeURIComponent(next)}`;
/**
 * Where to go after sign-in. Only a path on this site: a full URL (Auth.js sends one) keeps just its path,
 * so a crafted link can never send someone to another site.
 */
export function safeNext(next: unknown) {
  if (typeof next !== "string" || !next) return "/dashboard";
  try {
    const url = new URL(next, "http://courseit.local");
    return `${url.pathname}${url.search}${url.hash}`.startsWith("//") ? "/dashboard" : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}
