ALTER TABLE "course" ADD COLUMN "tags" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "course" ADD COLUMN "language" text;