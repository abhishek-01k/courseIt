ALTER TABLE "user" ALTER COLUMN "minutes_per_day" SET DEFAULT 90;--> statement-breakpoint
UPDATE "user" SET "minutes_per_day" = 90 WHERE "minutes_per_day" = 30;-- users still on the old 30-minute default move to the new one
