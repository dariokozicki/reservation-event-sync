CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"status" text NOT NULL,
	"guest_name" text NOT NULL,
	"guest_email" text NOT NULL,
	"property" text NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"guests" integer NOT NULL,
	"cancellation_reason" text,
	CONSTRAINT "reservation_version_positive" CHECK ("reservations"."version" >= 1),
	CONSTRAINT "reservation_status_valid"
		CHECK ("reservations"."status" in ('pending', 'confirmed', 'cancelled')),
	CONSTRAINT "reservation_guest_count_valid" CHECK ("reservations"."guests" between 1 and 12),
	CONSTRAINT "reservation_dates_valid" CHECK ("reservations"."check_out" > "reservations"."check_in")
);
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_id_streams_id_fk"
FOREIGN KEY ("id") REFERENCES "public"."streams"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "reservations" (
  "id", "version", "status", "guest_name", "guest_email", "property",
  "check_in", "check_out", "guests", "cancellation_reason"
)
SELECT
  "id", ("local"->>'version')::integer, "local"->>'status',
  "local"->>'guestName', "local"->>'guestEmail', "local"->>'property',
  ("local"->>'checkIn')::date, ("local"->>'checkOut')::date,
  ("local"->>'guests')::integer, "local"->>'cancellationReason'
FROM "streams"
WHERE "local" IS NOT NULL AND "local" <> 'null'::jsonb;
--> statement-breakpoint
ALTER TABLE "streams" DROP COLUMN "local";
