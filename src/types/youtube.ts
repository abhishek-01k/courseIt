export type Chapter = { title: string; startSeconds: number };

export type YouTubeSource = { type: "video" | "playlist"; id: string };

export type YouTubeVideo = {
  id: string;
  title: string;
  channel: string;
  channelId: string;
  durationSeconds: number;
  thumbnail: string | null;
  chapters: Chapter[];
};

export type YouTubeCourseSource = {
  title: string;
  channel: string;
  thumbnail: string | null;
  videos: YouTubeVideo[];
};

export type YouTubeChannel = {
  id: string;
  title: string;
  handle: string | null;
  avatarUrl: string | null;
  subscribers: number | null;
};
