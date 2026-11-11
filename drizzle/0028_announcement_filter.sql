ALTER TABLE "announcement" ADD COLUMN "filter" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
-- Announcements from before filters: the fixed audience becomes the same filter.
UPDATE "announcement" SET "filter" = CASE "audience"
  WHEN 'free' THEN '{"plan":"unpaid"}'::jsonb
  WHEN 'paid' THEN '{"plan":"paid"}'::jsonb
  WHEN 'admins' THEN '{"admins":"yes"}'::jsonb
  ELSE '{}'::jsonb END;
