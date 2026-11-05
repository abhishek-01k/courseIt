ALTER TABLE "course" DROP CONSTRAINT "course_source_id_unique";--> statement-breakpoint
ALTER TABLE "course" ADD COLUMN "is_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "course_public_source_idx" ON "course" USING btree ("source_id") WHERE not "course"."is_private";--> statement-breakpoint
CREATE UNIQUE INDEX "course_private_source_idx" ON "course" USING btree ("source_id","created_by") WHERE "course"."is_private";