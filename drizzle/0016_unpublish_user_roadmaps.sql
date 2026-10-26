-- Learners can't publish roadmaps any more (only admins will); they share links instead.
-- Existing follows stay and now count as enrollments.
UPDATE "roadmap" SET "published" = false WHERE "published" = true;
