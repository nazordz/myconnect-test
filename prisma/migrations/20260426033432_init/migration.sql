-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "ConciergeSessionStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ConciergeMessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT', 'DEVELOPER');

-- CreateEnum
CREATE TYPE "ToolCallStatus" AS ENUM ('REQUESTED', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "concierge_sessions" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "attendee_id" UUID NOT NULL,
    "status" "ConciergeSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_intent" TEXT,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concierge_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concierge_messages" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "role" "ConciergeMessageRole" NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concierge_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_feedback" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendees" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "company" TEXT,
    "role" TEXT,
    "skills" TEXT[],
    "looking_for" TEXT,
    "open_to_chat" BOOLEAN NOT NULL DEFAULT true,
    "profile_text" TEXT,
    "embedding" vector(1536),
    "embedding_model" TEXT,
    "embedding_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "concierge_sessions_event_id_idx" ON "concierge_sessions"("event_id");

-- CreateIndex
CREATE INDEX "concierge_sessions_attendee_id_idx" ON "concierge_sessions"("attendee_id");

-- CreateIndex
CREATE INDEX "concierge_sessions_status_idx" ON "concierge_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "concierge_sessions_event_id_attendee_id_key" ON "concierge_sessions"("event_id", "attendee_id");

-- CreateIndex
CREATE INDEX "concierge_messages_session_id_created_at_idx" ON "concierge_messages"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "concierge_messages_role_idx" ON "concierge_messages"("role");

-- CreateIndex
CREATE INDEX "message_feedback_message_id_idx" ON "message_feedback"("message_id");

-- CreateIndex
CREATE INDEX "message_feedback_rating_idx" ON "message_feedback"("rating");

-- CreateIndex
CREATE INDEX "events_start_at_idx" ON "events"("start_at");

-- CreateIndex
CREATE INDEX "events_end_at_idx" ON "events"("end_at");

-- CreateIndex
CREATE INDEX "events_location_idx" ON "events"("location");

-- CreateIndex
CREATE INDEX "attendees_event_id_idx" ON "attendees"("event_id");

-- CreateIndex
CREATE INDEX "attendees_name_idx" ON "attendees"("name");

-- CreateIndex
CREATE INDEX "attendees_company_idx" ON "attendees"("company");

-- CreateIndex
CREATE INDEX "attendees_role_idx" ON "attendees"("role");

-- CreateIndex
CREATE INDEX "attendees_event_id_open_to_chat_idx" ON "attendees"("event_id", "open_to_chat");

-- AddForeignKey
ALTER TABLE "concierge_sessions" ADD CONSTRAINT "concierge_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_sessions" ADD CONSTRAINT "concierge_sessions_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_messages" ADD CONSTRAINT "concierge_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "concierge_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_feedback" ADD CONSTRAINT "message_feedback_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "concierge_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
