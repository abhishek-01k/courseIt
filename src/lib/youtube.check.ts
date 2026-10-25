// Run: pnpm dlx tsx src/lib/youtube.check.ts
import assert from "node:assert/strict";
import { parseChapters, parseDuration, parseYouTubeUrl } from "./youtube";

const v = { type: "video", id: "dQw4w9WgXcQ" };
assert.deepEqual(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s"), v);
assert.deepEqual(parseYouTubeUrl("youtube.com/watch?v=dQw4w9WgXcQ"), v);
assert.deepEqual(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ?si=abc"), v);
assert.deepEqual(parseYouTubeUrl("https://m.youtube.com/shorts/dQw4w9WgXcQ"), v);
assert.deepEqual(parseYouTubeUrl("https://www.youtube.com/live/dQw4w9WgXcQ"), v);
assert.deepEqual(parseYouTubeUrl("https://www.youtube.com/playlist?list=PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d"), { type: "playlist", id: "PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d" });
assert.deepEqual(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d"), { type: "playlist", id: "PL4cUxeGkcC9gZD-Tvwfod2gaISzfRiP9d" });
assert.deepEqual(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ"), v); // mix → the video
assert.equal(parseYouTubeUrl("https://vimeo.com/123"), null);
assert.equal(parseYouTubeUrl("https://evil.com/watch?v=dQw4w9WgXcQ"), null);
assert.equal(parseYouTubeUrl("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ"), null);
assert.equal(parseYouTubeUrl("not a link"), null);

assert.equal(parseDuration("PT6H2M14S"), 21734);
assert.equal(parseDuration("PT45S"), 45);
assert.equal(parseDuration("P1DT1S"), 86401);

assert.deepEqual(parseChapters("Intro text\n0:00 Intro\n4:12 - JSX\n1:02:05 Hooks"), [
  { title: "Intro", startSeconds: 0 },
  { title: "JSX", startSeconds: 252 },
  { title: "Hooks", startSeconds: 3725 },
]);
assert.deepEqual(parseChapters("4:12 not starting at zero\n5:00 b"), []);
console.log("youtube checks passed");
