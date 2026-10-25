CREATE TABLE "user_day" (
	"user_id" text NOT NULL,
	"day" text NOT NULL,
	CONSTRAINT "user_day_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
ALTER TABLE "user_day" ADD CONSTRAINT "user_day_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;