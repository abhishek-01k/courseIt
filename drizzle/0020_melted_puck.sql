CREATE TABLE "email_log" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"user_id" text,
	"template" text NOT NULL,
	"to" text,
	"status" text DEFAULT 'sending' NOT NULL,
	"detail" text,
	"resend_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_log_key_unique" UNIQUE("key"),
	CONSTRAINT "email_log_resend_id_unique" UNIQUE("resend_id")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_suppressed_at" timestamp;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_log_user_idx" ON "email_log" USING btree ("user_id","created_at");