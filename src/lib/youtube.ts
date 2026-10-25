import { COURSE_LIMITS } from "@/lib/constants";
import type { Chapter, YouTubeChannel, YouTubeCourseSource, YouTubeSource, YouTubeVideo } from "@/types/youtube";

const API = "https://www.googleapis.com/youtube/v3";
const VIDEO_ID = /^[\w-]{11}$/;
const LIST_ID = /^[\w-]{10,}$/;

// Thrown for anything the learner should see ("private video", "too long"…).
export class YouTubeError extends Error {}

/** Accepts watch, youtu.be, shorts, embed, live and playlist links. Returns null if it isn't one. */
export function parseYouTubeUrl(input: string): YouTubeSource | null {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  const list = url.searchParams.get("list");
  // Auto-generated mixes (RD…) aren't real playlists and can't be fetched.
  const playlist = list && LIST_ID.test(list) && !list.startsWith("RD") ? list : null;

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return playlist ? { type: "playlist", id: playlist } : VIDEO_ID.test(id) ? { type: "video", id } : null;
  }
  if (host !== "youtube.com" && host !== "youtube-nocookie.com") return null;
  if (playlist) return { type: "playlist", id: playlist };

  const v = url.searchParams.get("v");
  if (url.pathname === "/watch" && v && VIDEO_ID.test(v)) return { type: "video", id: v };
  const [, kind, id] = url.pathname.split("/");
  if (["shorts", "embed", "live", "v"].includes(kind) && id && VIDEO_ID.test(id)) return { type: "video", id };
  return null;
}

/** "PT1H2M3S" → 3723 */
export function parseDuration(iso: string): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return 0;
  const [, d, h, min, s] = m.map((n) => Number(n ?? 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

/** Creator chapters are "0:00 Intro" lines in the description; YouTube needs the first at 0:00. */
export function parseChapters(description: string): Chapter[] {
  const chapters: Chapter[] = [];
  for (const line of description.split("\n")) {
    const m = /^\s*[([]?((?:\d{1,2}:)?\d{1,2}:\d{2})[)\]]?\s*[-–—:|]?\s*(.+)$/.exec(line);
    if (!m) continue;
    const startSeconds = m[1].split(":").reduce((total, part) => total * 60 + Number(part), 0);
    chapters.push({ title: m[2].trim(), startSeconds });
  }
  return chapters.length >= 2 && chapters[0].startSeconds === 0 ? chapters : [];
}

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  const res = await fetch(`${API}/${path}?${new URLSearchParams({ ...params, key })}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`YouTube API ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

type ApiThumbs = Record<string, { url: string } | undefined>;
type ApiVideo = {
  id: string;
  snippet: { title: string; channelTitle: string; channelId: string; description: string; liveBroadcastContent: string; thumbnails: ApiThumbs };
  contentDetails: { duration: string };
  status: { embeddable: boolean; privacyStatus: string };
};

const thumb = (t: ApiThumbs) => (t.maxres ?? t.high ?? t.medium ?? t.default)?.url ?? null;

// 1 quota unit per call of up to 50 ids.
async function fetchVideos(ids: string[]): Promise<YouTubeVideo[]> {
  const found: ApiVideo[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const page = await get<{ items: ApiVideo[] }>("videos", { part: "snippet,contentDetails,status", id: ids.slice(i, i + 50).join(",") });
    found.push(...page.items);
  }
  return found
    .filter((v) => v.status.embeddable && v.status.privacyStatus !== "private" && v.snippet.liveBroadcastContent === "none")
    .map((v) => ({
      id: v.id,
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      channelId: v.snippet.channelId,
      durationSeconds: parseDuration(v.contentDetails.duration),
      thumbnail: thumb(v.snippet.thumbnails),
      chapters: parseChapters(v.snippet.description),
    }));
}

export async function fetchCourseSource(source: YouTubeSource): Promise<YouTubeCourseSource> {
  if (source.type === "video") {
    const [video] = await fetchVideos([source.id]);
    if (!video) throw new YouTubeError("We can't use that video. It may be private, live, or not allowed to play on other sites.");
    return { title: video.title, channel: video.channel, thumbnail: video.thumbnail, videos: [video] };
  }

  const { items } = await get<{ items: { snippet: { title: string; channelTitle: string; thumbnails: ApiThumbs } }[] }>("playlists", { part: "snippet", id: source.id });
  if (!items[0]) throw new YouTubeError("We couldn't find that playlist. It may be private or deleted.");

  const ids: string[] = [];
  let pageToken = "";
  do {
    const page = await get<{ items: { contentDetails: { videoId: string } }[]; nextPageToken?: string }>("playlistItems", {
      part: "contentDetails",
      playlistId: source.id,
      maxResults: "50",
      ...(pageToken && { pageToken }),
    });
    ids.push(...page.items.map((i) => i.contentDetails.videoId));
    pageToken = page.nextPageToken ?? "";
  } while (pageToken && ids.length < COURSE_LIMITS.maxPlaylistVideos);

  if (ids.length >= COURSE_LIMITS.maxPlaylistVideos && pageToken) {
    throw new YouTubeError(`That playlist is too long. We support up to ${COURSE_LIMITS.maxPlaylistVideos} videos for now.`);
  }
  const videos = await fetchVideos([...new Set(ids)]); // a playlist can repeat a video
  if (!videos.length) throw new YouTubeError("None of the videos in that playlist can be played on other sites.");
  return { title: items[0].snippet.title, channel: items[0].snippet.channelTitle, thumbnail: thumb(items[0].snippet.thumbnails), videos };
}

/** A video's channel id (1 quota unit), for videos saved before we stored it. */
export async function fetchVideoChannelId(videoId: string): Promise<string | null> {
  const { items } = await get<{ items: { snippet: { channelId: string } }[] }>("videos", { part: "snippet", id: videoId });
  return items[0]?.snippet.channelId ?? null;
}

/** Name, handle, photo and subscriber count of a channel (1 quota unit). */
export async function fetchChannel(channelId: string): Promise<YouTubeChannel | null> {
  const { items } = await get<{
    items: { id: string; snippet: { title: string; customUrl?: string; thumbnails: ApiThumbs }; statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean } }[];
  }>("channels", { part: "snippet,statistics", id: channelId });
  const c = items[0];
  if (!c) return null;
  const subs = c.statistics?.hiddenSubscriberCount ? null : Number(c.statistics?.subscriberCount);
  return {
    id: c.id,
    title: c.snippet.title,
    handle: c.snippet.customUrl ? (c.snippet.customUrl.startsWith("@") ? c.snippet.customUrl : `@${c.snippet.customUrl}`) : null,
    avatarUrl: (c.snippet.thumbnails.medium ?? c.snippet.thumbnails.default)?.url ?? null,
    subscribers: Number.isFinite(subs) ? subs : null,
  };
}
