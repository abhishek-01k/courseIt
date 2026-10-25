CREATE TABLE "lesson_skip" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"course_id" text NOT NULL,
	CONSTRAINT "lesson_skip_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "placement_question" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"position" integer NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb NOT NULL,
	"answer_index" integer NOT NULL,
	"explanation" text NOT NULL,
	"lesson_ids" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_result" (
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"answers" jsonb NOT NULL,
	"score" integer NOT NULL,
	"total" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "placement_result_user_id_course_id_pk" PRIMARY KEY("user_id","course_id")
);
--> statement-breakpoint
ALTER TABLE "lesson_skip" ADD CONSTRAINT "lesson_skip_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_skip" ADD CONSTRAINT "lesson_skip_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_skip" ADD CONSTRAINT "lesson_skip_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_question" ADD CONSTRAINT "placement_question_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_result" ADD CONSTRAINT "placement_result_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_result" ADD CONSTRAINT "placement_result_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_skip_user_course_idx" ON "lesson_skip" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "placement_question_course_idx" ON "placement_question" USING btree ("course_id","position");