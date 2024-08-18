CREATE TABLE IF NOT EXISTS "eventClass" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"class_name" varchar(4) NOT NULL,
	"total_entries" integer NOT NULL,
	"sold_entries" integer DEFAULT 0 NOT NULL,
	"create_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_name" varchar(200) NOT NULL,
	"create_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "eventClass" ADD CONSTRAINT "eventClass_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
