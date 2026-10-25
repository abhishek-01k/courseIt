CREATE TABLE "lesson_note" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"course_id" text NOT NULL,
	"body" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_note_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "lesson_watch" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"course_id" text NOT NULL,
	"watched_seconds" integer DEFAULT 0 NOT NULL,
	"watched_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_watch_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
ALTER TABLE "enrollment" ADD COLUMN "minutes_per_day" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_note" ADD CONSTRAINT "lesson_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_note" ADD CONSTRAINT "lesson_note_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_note" ADD CONSTRAINT "lesson_note_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_watch" ADD CONSTRAINT "lesson_watch_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_watch" ADD CONSTRAINT "lesson_watch_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_watch" ADD CONSTRAINT "lesson_watch_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_note_user_idx" ON "lesson_note" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "lesson_watch_user_course_idx" ON "lesson_watch" USING btree ("user_id","course_id");