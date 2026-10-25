CREATE TABLE "lesson" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"video_id" text NOT NULL,
	"start_seconds" integer NOT NULL,
	"end_seconds" integer NOT NULL,
	"summary" text NOT NULL,
	"notes" text,
	"ready" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"position" integer NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb NOT NULL,
	"answer_index" integer NOT NULL,
	"explanation" text NOT NULL,
	"replay_seconds" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_segment" (
	"video_id" text NOT NULL,
	"start_seconds" integer NOT NULL,
	"end_seconds" integer NOT NULL,
	"notes" text NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "video_segment_video_id_start_seconds_end_seconds_pk" PRIMARY KEY("video_id","start_seconds","end_seconds")
);
--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_segment" ADD CONSTRAINT "video_segment_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_course_idx" ON "lesson" USING btree ("course_id","position");--> statement-breakpoint
CREATE INDEX "question_lesson_idx" ON "question" USING btree ("lesson_id","position");