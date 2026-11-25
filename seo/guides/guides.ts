import howToFinish from "../content/guides/how-to-finish-a-youtube-course.json";
import playlistToCourse from "../content/guides/turn-a-youtube-playlist-into-a-course.json";

// Answer-first guides. One JSON file per guide in seo/content/guides/; add the import here to publish it.
// Rules (seo/PLAYBOOK.md): answer in the first 40 words, no invented facts or statistics (a number needs a primary
// source linked inline), 2-4 internal links, and `updated` changes only when the content does.
export type Guide = { slug: string; title: string; description: string; answer: string; updated: string; body: string };

export const GUIDES: Guide[] = [howToFinish, playlistToCourse];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug) ?? null;
