ALTER TABLE "users" ADD COLUMN "name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."appointments" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."appointment_status" CASCADE;--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'cancelled', 'completed');--> statement-breakpoint
ALTER TABLE "public"."appointments" ALTER COLUMN "status" SET DATA TYPE "public"."appointment_status" USING "status"::"public"."appointment_status";