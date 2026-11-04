ALTER TABLE "user" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "plan_status" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "plan_renews_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "plan_cancels_at_renewal" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "dodo_customer_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "dodo_subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_dodo_customer_id_unique" UNIQUE("dodo_customer_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_dodo_subscription_id_unique" UNIQUE("dodo_subscription_id");