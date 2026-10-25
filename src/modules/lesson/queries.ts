import { eq } from "drizzle-orm";
import { db } from "@/db";
import { channels, videos } from "@/db/schema";
import { fetchChannel, fetchVideoChannelId } from "@/lib/youtube";

const DAY = 24 * 3600 * 1000;

/**
 * The creator of a video for the card under the player. Cached in our database and refreshed from the
 * YouTube API when older than a day (well inside YouTube's 30-day limit). If YouTube can't be reached,
 * an older copy is better than nothing; with no copy at all, the card falls back to the channel name.
 */
export async function getCreator(videoId: string) {
  const [video] = await db.select({ channel: videos.channel, channelId: videos.channelId }).from(videos).where(eq(videos.id, videoId));
  if (!video) return null;
  const fallback = { id: video.channelId, title: video.channel, handle: null, avatarUrl: null, subscribers: null };

  try {
    let channelId = video.channelId;
    if (!channelId) {
      channelId = await fetchVideoChannelId(videoId);
      if (!channelId) return fallback;
      await db.update(videos).set({ channelId }).where(eq(videos.id, videoId));
    }
    const [cached] = await db.select().from(channels).where(eq(channels.id, channelId));
    if (cached && Date.now() - cached.updatedAt.getTime() < DAY) return cached;

    const fresh = await fetchChannel(channelId);
    if (!fresh) return cached ?? { ...fallback, id: channelId };
    const row = { ...fresh, updatedAt: new Date() };
    await db.insert(channels).values(row).onConflictDoUpdate({ target: channels.id, set: row });
    return row;
  } catch (error) {
    console.error("getCreator failed", videoId, error instanceof Error ? error.message : error);
    if (video.channelId) {
      const [stale] = await db.select().from(channels).where(eq(channels.id, video.channelId));
      if (stale) return stale;
    }
    return fallback;
  }
}
