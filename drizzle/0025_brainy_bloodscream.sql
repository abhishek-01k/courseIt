ALTER TABLE "lesson" ADD COLUMN "reading_at" timestamp;--> statement-breakpoint
-- Lessons that already have links were searched during their build: mark them so no one searches them again.
UPDATE "lesson" SET "reading_at" = now() WHERE "reading" <> '[]'::jsonb;
