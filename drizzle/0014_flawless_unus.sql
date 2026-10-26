CREATE TABLE "roadmap_follow" (
	"user_id" text NOT NULL,
	"roadmap_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roadmap_follow_user_id_roadmap_id_pk" PRIMARY KEY("user_id","roadmap_id")
);
--> statement-breakpoint
ALTER TABLE "roadmap_follow" ADD CONSTRAINT "roadmap_follow_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_follow" ADD CONSTRAINT "roadmap_follow_roadmap_id_roadmap_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmap"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "roadmap_follow_roadmap_idx" ON "roadmap_follow" USING btree ("roadmap_id","created_at");