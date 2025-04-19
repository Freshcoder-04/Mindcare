ALTER TABLE "chat_room_memberships" ADD CONSTRAINT "chat_room_memberships_user_id_room_id_pk" PRIMARY KEY("user_id","room_id");--> statement-breakpoint
ALTER TABLE "chat_room_memberships" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "chat_room_memberships" DROP COLUMN "joined_at";