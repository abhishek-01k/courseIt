ALTER TABLE "user" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
-- Existing learners: their first course or enrollment is the best record of when they joined.
UPDATE "user" u SET "created_at" = least(
  u."created_at",
  coalesce((SELECT min(e."created_at") FROM "enrollment" e WHERE e."user_id" = u."id"), u."created_at"),
  coalesce((SELECT min(c."created_at") FROM "course" c WHERE c."created_by" = u."id"), u."created_at")
);
