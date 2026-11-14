CREATE TABLE "email_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"outcome" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "confirmations" (
	"reservation_id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"payload" jsonb NOT NULL,
	"job_id" uuid NOT NULL,
	"status" text NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	CONSTRAINT "confirmations_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"outcome" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbox" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reservation_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"event" jsonb NOT NULL,
	"hash" text NOT NULL,
	"state" text NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "provider_receipts" (
	"key" text PRIMARY KEY NOT NULL,
	"reservation_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reservation_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"event" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "streams" (
	"id" uuid PRIMARY KEY NOT NULL,
	"scenario" text DEFAULT 'external' NOT NULL,
	"source" jsonb,
	"local" jsonb,
	"fault" text DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_attempts"
  ADD CONSTRAINT "email_attempts_reservation_id_streams_id_fk"
  FOREIGN KEY ("reservation_id")
  REFERENCES "public"."streams"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "confirmations"
  ADD CONSTRAINT "confirmations_reservation_id_streams_id_fk"
  FOREIGN KEY ("reservation_id")
  REFERENCES "public"."streams"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "deliveries"
  ADD CONSTRAINT "deliveries_reservation_id_streams_id_fk"
  FOREIGN KEY ("reservation_id")
  REFERENCES "public"."streams"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inbox"
  ADD CONSTRAINT "inbox_reservation_id_streams_id_fk"
  FOREIGN KEY ("reservation_id")
  REFERENCES "public"."streams"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "provider_receipts"
  ADD CONSTRAINT "provider_receipts_reservation_id_streams_id_fk"
  FOREIGN KEY ("reservation_id")
  REFERENCES "public"."streams"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "source_events"
  ADD CONSTRAINT "source_events_reservation_id_streams_id_fk"
  FOREIGN KEY ("reservation_id")
  REFERENCES "public"."streams"("id")
  ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "inbox_reservation_version" ON "inbox"
  USING btree ("reservation_id","version");
--> statement-breakpoint
CREATE UNIQUE INDEX "source_reservation_version" ON "source_events"
  USING btree ("reservation_id","version");