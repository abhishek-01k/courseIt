import { serve } from "inngest/next";
import { buildCourse } from "@/inngest/build-course";
import { inngest } from "@/inngest/client";

// Inngest calls this route to run each step. Course builds can be long, so allow the maximum.
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({ client: inngest, functions: [buildCourse] });
