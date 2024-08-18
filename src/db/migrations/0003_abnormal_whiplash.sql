ALTER TABLE "eventClass" RENAME TO "event_class";--> statement-breakpoint
ALTER TABLE "event_class" DROP CONSTRAINT "eventClass_event_id_events_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_class" ADD CONSTRAINT "event_class_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
