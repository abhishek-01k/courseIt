CREATE TABLE "roadmap_course" (
	"roadmap_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"course_id" text NOT NULL,
	"position" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roadmap_course_roadmap_id_course_id_pk" PRIMARY KEY("roadmap_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "roadmap_stage" (
	"id" text PRIMARY KEY NOT NULL,
	"roadmap_id" text NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmap" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roadmap_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "roadmap_course" ADD CONSTRAINT "roadmap_course_roadmap_id_roadmap_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmap"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_course" ADD CONSTRAINT "roadmap_course_stage_id_roadmap_stage_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."roadmap_stage"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_course" ADD CONSTRAINT "roadmap_course_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_stage" ADD CONSTRAINT "roadmap_stage_roadmap_id_roadmap_id_fk" FOREIGN KEY ("roadmap_id") REFERENCES "public"."roadmap"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap" ADD CONSTRAINT "roadmap_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "roadmap_course_stage_idx" ON "roadmap_course" USING btree ("stage_id","position");--> statement-breakpoint
CREATE INDEX "roadmap_stage_roadmap_idx" ON "roadmap_stage" USING btree ("roadmap_id","position");--> statement-breakpoint
CREATE INDEX "roadmap_owner_idx" ON "roadmap" USING btree ("owner_id","updated_at");--> statement-breakpoint
CREATE INDEX "roadmap_published_idx" ON "roadmap" USING btree ("published","updated_at");