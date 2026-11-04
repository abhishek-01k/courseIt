// PAUSE_COURSE_BUILDS=1 stops everything that costs credits: no new courses, no resumes or retries, and
// builds already running stop at their next step (Supadata, Gemini, Nemotron, Tavily, Inngest all go quiet).
// Courses already built stay fully usable, and joining one someone else built still works (it's free).
// Unpause and learners can press Retry: a stopped build resumes where it left off.
export const buildsPaused = () => process.env.PAUSE_COURSE_BUILDS === "1";

export const BUILDS_PAUSED_MESSAGE =
  "New courses are paused for a little while: a lot of people showed up at once. Courses already built still open.";
