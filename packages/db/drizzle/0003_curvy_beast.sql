CREATE TYPE "public"."notification_channel" AS ENUM('email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lead_id" uuid,
	"channel" "notification_channel" NOT NULL,
	"recipient" text NOT NULL,
	"status" "notification_status" NOT NULL,
	"error" text,
	"provider_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "notify_email" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "notify_phone" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "notify_email_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "notify_sms_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_tenant_idx" ON "notifications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_lead_idx" ON "notifications" USING btree ("lead_id");