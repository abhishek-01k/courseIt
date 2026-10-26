CREATE TABLE "note" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"course_id" text NOT NULL,
	"seconds" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "note_user_lesson_idx" ON "note" USING btree ("user_id","lesson_id","seconds");--> statement-breakpoint
CREATE INDEX "note_user_course_idx" ON "note" USING btree ("user_id","course_id","updated_at");--> statement-breakpoint
INSERT INTO "note" ("id", "user_id", "lesson_id", "course_id", "seconds", "body", "created_at", "updated_at")
SELECT gen_random_uuid()::text, n."user_id", n."lesson_id", n."course_id", l."start_seconds", n."body", n."updated_at", n."updated_at"
FROM "lesson_note" n JOIN "lesson" l ON l."id" = n."lesson_id"
WHERE trim(n."body") <> '';-- existing free-text notes become one note at the start of their lesson
