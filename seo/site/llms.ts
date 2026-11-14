import { SITE_URL } from "../config";

// llms.txt (llmstxt.org): a plain-markdown summary that AI assistants can read in one fetch.
// Rules: only facts that are true on the live site today. No prices (they change and differ by region: link /pricing),
// no usage numbers without an "as of" date, no promises.
export const LLMS_TXT = `# CourseIt

> CourseIt turns any YouTube video or playlist into a structured course you can finish: lessons, study notes, quizzes, a placement test and a daily plan that fits your time. Videos play in YouTube's own player, so creators keep their views.

CourseIt is made by Triggerfy, a small studio run by Abhishek Kumar (New Delhi, India). It is a member of the NVIDIA Inception program. Courses are written by NVIDIA Nemotron models on Nebius Token Factory, from each video's own captions.

## What it does

- Paste a YouTube video or playlist link; CourseIt reads the captions and splits the content into lessons on topic boundaries.
- Each lesson gets study notes and a short quiz with explanations; a wrong answer can replay the exact moment the idea is taught.
- A short placement test skips lessons you already know.
- A daily plan packs the lessons into the minutes per day you choose.
- Roadmaps combine courses from different creators into one learning path, in stages.
- Videos without captions can't be turned into courses.
- Joining a course someone already built is free. Plans are for building new courses: see [Pricing](${SITE_URL}/pricing).

## Key pages

- [Home](${SITE_URL}/): what CourseIt is and how it works
- [Pricing](${SITE_URL}/pricing): plans and what each includes, priced by region
- [About](${SITE_URL}/about): who builds CourseIt and why
- [Privacy policy](${SITE_URL}/privacy)
- [Terms](${SITE_URL}/terms)
- [Refunds](${SITE_URL}/refunds)

## Optional

- [Source code on GitHub](https://github.com/abhishek-01k/courseIt) (MIT licence)
- [Demo video](https://youtu.be/dm69e4neiP0)
`;

export function GET() {
  return new Response(LLMS_TXT, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
