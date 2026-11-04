CREATE TABLE "announcement" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"heading" text NOT NULL,
	"body" text NOT NULL,
	"cta_label" text,
	"cta_href" text,
	"audience" text DEFAULT 'all' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"recipients" integer,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_news" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;