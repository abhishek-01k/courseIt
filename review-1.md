courseIt code review: 13 findings, ranked by severity

Review only; no files were changed. All paths are under /Users/abhisheksingh/Desktop/hackathon/courseIt/.

High

1. Rebuilding a failed course deletes every learner’s progress. src/modules/course/actions.ts:31-34 together with src/inngest/build-course.ts:141-151.

Bug: When someone pastes the link of a course whose status is failed, the action sends BUILD_COURSE without resume. The plan step then runs db.delete(lessons). Because attempts, lessonProgress, lessonWatch and lessonNotes all cascade on lessons.id (schema.ts:153,168,182,196), that delete wipes every learner’s answers, progress, watch time and notes.
How a course with lessons ends up failed: a resume run whose Gemini read … step or fetch transcripts step runs out of retries. Those steps are not caught the way lessons are, so onFailure marks the whole course failed even though its lessons exist.
Scenario: a course is partly done and used by 10 learners. A Retry fails on a Supadata 500. The next person to paste the URL erases all 10 learners’ data.
Fix: send resume: true whenever the course already exists, and never delete lessons when lessons with user data exist.

2. Visiting a course through Community never enrolls you. src/modules/course/queries.ts:23-28 (touchEnrollment), src/components/course-tile.tsx:20, src/modules/course/actions.ts:112-121.

Bug: Community tiles link straight to /courses/[id]. touchEnrollment is an UPDATE only, so with no enrollment row it touches nothing.
Effects:
setPaceAction updates 0 rows, so the pace picker does nothing.
The course never shows in My courses or Continue learning.
The plan always falls back to 30 min a day.
Fix: make touchEnrollment an upsert, the same as enroll() with onConflictDoUpdate.

3. Watch time is only counted per session, so 80% can be unreachable. src/modules/lesson/components/focus-player.tsx:83,95 with src/app/api/watch/route.ts:32.

Bug: seen starts empty on every mount, and the server keeps greatest(old, sessionCount). Two sessions are never combined.
Scenario: a learner watches the first 50% today and the second 50% tomorrow. Stored progress is max(50%, 50%) = 50%, so the lesson is never “Watched”. The bar also doesn’t move in session 2 until it passes the old value.
Fix: store which seconds were watched, not a count. Either send the seen seconds (or ranges) and union them server-side (e.g. an int[] or bitmap column), or seed seen from the stored set.

4. The model fallback chain can’t run inside Vercel’s 300s limit. src/lib/ai.ts:64,94-103 vs src/app/api/inngest/route.ts (maxDuration = 300).

Bug: a timeout counts as “busy”, which means 3 tries × 120s on the same model before moving to a backup. Two timeouts plus the third attempt already pass 300s, so Vercel kills the invocation and Inngest retries the step from the start.
Scenario: writeLesson with thinking on at 16k tokens is slow. Every attempt dies on the first model, the backup models are never reached, and after 5 attempts the lesson is skipped.
Fix: give each call an overall time budget (about 250s) and on a timeout go straight to the next model instead of waiting it out.

5. An empty quiz option shifts the correct answer to the wrong option. src/lib/course-writer.ts:103-106.

Bug: x.options.map(str).filter(Boolean) drops empty or non-string options. answerIndex still refers to the original positions.
Scenario: the model returns ["", "B", "C", "D"] with answerIndex: 1. The filtered list is ["B", "C", "D"] and index 1 is now “C”, so a wrong answer is marked correct for every learner.
Fix: reject the question if any option is empty: if (options.length !== x.options.length) return null.
Medium

6. One failed Gemini segment fails the whole course. src/inngest/build-course.ts:116-132.

Bug: the read … steps aren’t wrapped like buildOrSkip. A single 10-minute piece that fails 5 times sets the course to failed, even when its other videos are fine. This is also what sets up finding 1.
Fix: add .catch to each piece the same way lessons have it, and let planning work from whatever notes exist.

7. The pace picker doesn’t update after saving. src/modules/course/actions.ts:112-121.

Bug: the action has no refresh() or revalidatePath, so the page isn’t re-rendered.
Scenario: on a ready course (no auto-refresh running), clicking “60 min” saves to the DB, but the highlighted chip, the day count and the day groups stay on the old pace until the next navigation.
Fix: call refresh() from next/cache (or revalidatePath) at the end of the action.

8. Any signed-in user can retry any course. src/modules/course/actions.ts:100-109, called with .bind(null, courseId) in retry-banner.tsx:9.

Bug: the action checks only that someone is signed in. It doesn’t check enrollment, and it doesn’t check that the course is actually failed or has an error; it allows any status except queued, reading or building. The bound courseId is not encrypted, so the client controls it.
Scenario: a script calls the action for every course ID listed in Community, repeatedly, and spends AI and Inngest budget.
Fix: require an enrollment row and status === "failed" || error != null.

9. Play does nothing after the lesson ends. src/modules/lesson/components/focus-player.tsx:112-115,170-173.

Bug: tick pauses at end - 0.3. Pressing Play resumes there, the next tick sees t >= end - 0.3, pauses again and fires onEnded again.
Scenario: a learner finishes a lesson and presses Play to rewatch; it’s stuck until they drag the slider back.
Fix: in play(), if position >= length - 1, call seek(0) first.

10. A cancelled build keeps running steps that are already in flight. src/inngest/build-course.ts:59.

Inngest behaviour (checked):
The event that starts a run does not cancel that same run.
Catching a failed step.run with .catch inside Promise.all is valid in v4.26 (it rejects with a StepError, and optimizeParallelism defaults to true).
Step IDs are unique.
Bug: cancelOn only stops future steps. A step that is already executing finishes.
Scenario: two people paste the same failed URL at the same moment. Both non-resume plan steps can delete and re-insert lessons, and the old run’s lesson steps then write to deleted lesson IDs, or its finish step sets the course to ready while the new run is still reading.
Fix: guard writes with a per-run token, e.g. store event.id as courses.buildId and add where buildId = ….
Low

11. Build progress can be undercounted. src/inngest/build-course.ts:174-179 (and 126-128).

Bug: the count(*) subquery under READ COMMITTED doesn’t see the other parallel transactions’ uncommitted ready = true rows, so the comment “parallel steps can’t overwrite each other” isn’t true. The bar can stall or go backwards.
Impact: cosmetic only, because finish sets 100.
Fix: calculate progress in finish or from a separate read; don’t trust it as a counter.

12. The streak can break on daylight-saving days. src/modules/dashboard/queries.ts:17-22.

Bug: going back one day by subtracting 86,400,000 ms skips a calendar day after a 23-hour day.
Scenario: at 00:30 on the day after spring-forward, minus 24h lands two days back, so the streak resets.
Fix: step back on the YYYY-MM-DD string with UTC date arithmetic instead of the timestamp.

13. Accessibility issues on screen readers.

focus-player.tsx:226-231: a focusable div with aria-label but no role, so many screen readers ignore the label and the keyboard help is never announced. Add role="group" (or "region").
quiz.tsx:54: key={option} clashes when two options have the same text.
aria-label on plain <span>s (lesson-list.tsx:51, playlist.tsx:55) is ignored. Use sr-only text instead.
Checked and fine
SQL: the greatest and coalesce(watched_at, now()/null) upsert is correct and never moves backwards. The integer division in the progress formulas is fine.
cacheComponents: new Date() comes after auth() and inside <Suspense> on the course, lesson and dashboard pages.
Player effect: dependencies and cleanup are fine, including StrictMode double-mount. useImperativeHandle and onKey are rebuilt each render, so they don’t use stale values.
Notes and answers: they are scoped to the user. saveAnswerAction grades on the server.