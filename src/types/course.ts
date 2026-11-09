// Which plan limit stopped a new course: the monthly count, the monthly hours, or how long the video is.
// Sends the learner to /plans.
export type UpgradeReason = "limit" | "hours" | "length" | "retry";
export type BuildCourseState = { error?: string; upgrade?: UpgradeReason };

export type CourseTileData = {
  id: string;
  slug: string;
  title: string;
  channel: string;
  thumbnail: string | null;
  durationSeconds: number;
  status: "queued" | "reading" | "building" | "ready" | "failed";
  addedBy?: string | null;
  learners?: number;
  isPrivate?: boolean; // only its builder sees it (a Pro and Max perk)
  tags?: string[]; // topics, shown in Community
};
