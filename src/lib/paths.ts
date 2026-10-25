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
