ALTER TABLE "user" ADD COLUMN "minutes_per_day" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
UPDATE "user" u SET "minutes_per_day" = e.m FROM (SELECT "user_id", max("minutes_per_day") AS m FROM "enrollment" GROUP BY "user_id") e WHERE e."user_id" = u."id";--> statement-breakpoint
ALTER TABLE "enrollment" DROP COLUMN "minutes_per_day";