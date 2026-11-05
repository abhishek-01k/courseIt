-- Courses that failed because CourseIt's Supadata credits ran out (Nov 2026), before a single lesson was written.
-- A failed public course blocks anyone else from building that video and only offers "Upgrade to retry" on Free, so
-- they're removed: the next person to paste the video gets a normal new build, checked against their own plan.
-- Enrollments, build steps and roadmap links go with them (on delete cascade). 121 courses on the production copy.
DELETE FROM "course" c
WHERE c."status" = 'failed'
  AND c."error" LIKE 'Supadata 429%'
  AND NOT EXISTS (SELECT 1 FROM "lesson" l WHERE l."course_id" = c."id" AND l."ready");
