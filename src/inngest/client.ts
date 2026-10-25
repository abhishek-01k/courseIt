import { Inngest } from "inngest";

// Locally, run `pnpm inngest:dev` next to `pnpm dev`. On Vercel the Inngest integration sets the keys.
export const inngest = new Inngest({ id: "courseit" });

export const BUILD_COURSE = "course/build.requested";
