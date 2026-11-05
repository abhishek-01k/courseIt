// PAUSE_COURSE_BUILDS=1 stops everything that costs credits: no new courses, no resumes or retries, and
// builds already running stop at their next step (Supadata, Nemotron, Tavily, Inngest all go quiet).
// Courses already built stay fully usable, and joining one someone else built still works (it's free).
// Unpause and learners can press Retry: a stopped build resumes where it left off.
export const buildsPaused = () => process.env.PAUSE_COURSE_BUILDS === "1";

/** What a build stopped by the pause says (build-course.ts). Those can be resumed on any plan: it wasn't the learner's fault. */
export const PAUSED_BUILD_ERROR = "Paused for now. Press Retry later to finish building.";
export const stoppedByPause = (error: string | null | undefined) => error === PAUSED_BUILD_ERROR;

export const BUILDS_PAUSED_MESSAGE =
  "New courses are paused for a little while: a lot of people showed up at once. Courses already built still open.";

/** A build whose videos turned out to have no captions (build-course.ts). Retrying can't help, so it isn't offered. */
export const NO_CAPTIONS_ERROR = "This course can't be built: its videos have no captions.";
export const noCaptions = (error: string | null | undefined) => error === NO_CAPTIONS_ERROR;
