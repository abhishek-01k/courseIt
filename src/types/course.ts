export type BuildCourseState = { error?: string };

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
};
