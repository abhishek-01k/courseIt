CREATE TABLE "channel" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"handle" text,
	"avatar_url" text,
	"subscribers" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "channel_id" text;