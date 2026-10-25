CREATE TYPE "public"."step_status" AS ENUM('running', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "course_step" (
	"course_id" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"detail" text,
	"status" "step_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	CONSTRAINT "course_step_course_id_key_pk" PRIMARY KEY("course_id","key")
);
--> statement-breakpoint
ALTER TABLE "course_step" ADD CONSTRAINT "course_step_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;