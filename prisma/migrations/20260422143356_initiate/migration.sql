-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "ConciergeSessionStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ConciergeMessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT', 'TOOL');

-- CreateEnum
CREATE TYPE "ToolCallStatus" AS ENUM ('REQUESTED', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "LlmProvider" AS ENUM ('OPENAI', 'ANTHROPIC', 'GEMINI', 'OTHER');

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
    "name" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "company" TEXT,
    "role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendees" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "attendee_id" UUID NOT NULL,
    "skills" TEXT[],
    "looking_for" TEXT,
    "open_to_chat" BOOLEAN NOT NULL DEFAULT true,
    "profile_text" TEXT,
    "embedding" vector(1536),
    "embedding_model" TEXT,
    "embedding_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concierge_sessions" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "event_attendee_id" UUID NOT NULL,
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
    "content" JSONB NOT NULL,
    "raw_text" TEXT,
    "request_id" TEXT,
    "llm_provider" "LlmProvider",
    "llm_model" TEXT,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concierge_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concierge_tool_calls" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "tool_name" TEXT NOT NULL,
    "tool_call_id" TEXT,
    "status" "ToolCallStatus" NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "latency_ms" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concierge_tool_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_suggestions" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "requester_event_attendee_id" UUID NOT NULL,
    "candidate_event_attendee_id" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,
    "shared_ground" JSONB NOT NULL,
    "draft_intro_message" TEXT,
    "search_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_suggestions_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "events_startAt_idx" ON "events"("start_at");

-- CreateIndex
CREATE INDEX "events_endAt_idx" ON "events"("end_at");

-- CreateIndex
CREATE INDEX "events_location_idx" ON "events"("location");

-- CreateIndex
CREATE INDEX "attendees_name_idx" ON "attendees"("name");

-- CreateIndex
CREATE INDEX "attendees_company_idx" ON "attendees"("company");

-- CreateIndex
CREATE INDEX "attendees_role_idx" ON "attendees"("role");

-- CreateIndex
CREATE INDEX "event_attendees_eventId_idx" ON "event_attendees"("event_id");

-- CreateIndex
CREATE INDEX "event_attendees_attendeeId_idx" ON "event_attendees"("attendee_id");

-- CreateIndex
CREATE INDEX "event_attendees_eventId_openToChat_idx" ON "event_attendees"("event_id", "open_to_chat");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_eventId_attendeeId_key" ON "event_attendees"("event_id", "attendee_id");

-- CreateIndex
CREATE INDEX "concierge_sessions_eventId_idx" ON "concierge_sessions"("event_id");

-- CreateIndex
CREATE INDEX "concierge_sessions_eventAttendeeId_idx" ON "concierge_sessions"("event_attendee_id");

-- CreateIndex
CREATE INDEX "concierge_sessions_status_idx" ON "concierge_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "concierge_sessions_eventId_eventAttendeeId_key" ON "concierge_sessions"("event_id", "event_attendee_id");

-- CreateIndex
CREATE INDEX "concierge_messages_sessionId_createdAt_idx" ON "concierge_messages"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "concierge_messages_requestId_idx" ON "concierge_messages"("request_id");

-- CreateIndex
CREATE INDEX "concierge_messages_role_idx" ON "concierge_messages"("role");

-- CreateIndex
CREATE INDEX "concierge_tool_calls_messageId_idx" ON "concierge_tool_calls"("message_id");

-- CreateIndex
CREATE INDEX "concierge_tool_calls_toolName_idx" ON "concierge_tool_calls"("tool_name");

-- CreateIndex
CREATE INDEX "concierge_tool_calls_status_idx" ON "concierge_tool_calls"("status");

-- CreateIndex
CREATE INDEX "match_suggestions_messageId_idx" ON "match_suggestions"("message_id");

-- CreateIndex
CREATE INDEX "match_suggestions_requesterEventAttendeeId_idx" ON "match_suggestions"("requester_event_attendee_id");

-- CreateIndex
CREATE INDEX "match_suggestions_candidateEventAttendeeId_idx" ON "match_suggestions"("candidate_event_attendee_id");

-- CreateIndex
CREATE INDEX "match_suggestions_score_idx" ON "match_suggestions"("score");

-- CreateIndex
CREATE INDEX "match_suggestions_rank_idx" ON "match_suggestions"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "match_suggestions_messageId_candidateEventAttendeeId_key" ON "match_suggestions"("message_id", "candidate_event_attendee_id");

-- CreateIndex
CREATE INDEX "message_feedback_messageId_idx" ON "message_feedback"("message_id");

-- CreateIndex
CREATE INDEX "message_feedback_rating_idx" ON "message_feedback"("rating");

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_eventId_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_attendeeId_fkey" FOREIGN KEY ("attendee_id") REFERENCES "attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_sessions" ADD CONSTRAINT "concierge_sessions_eventId_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_sessions" ADD CONSTRAINT "concierge_sessions_eventAttendeeId_fkey" FOREIGN KEY ("event_attendee_id") REFERENCES "event_attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_messages" ADD CONSTRAINT "concierge_messages_sessionId_fkey" FOREIGN KEY ("session_id") REFERENCES "concierge_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_tool_calls" ADD CONSTRAINT "concierge_tool_calls_messageId_fkey" FOREIGN KEY ("message_id") REFERENCES "concierge_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_suggestions" ADD CONSTRAINT "match_suggestions_messageId_fkey" FOREIGN KEY ("message_id") REFERENCES "concierge_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_suggestions" ADD CONSTRAINT "match_suggestions_requesterEventAttendeeId_fkey" FOREIGN KEY ("requester_event_attendee_id") REFERENCES "event_attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_suggestions" ADD CONSTRAINT "match_suggestions_candidateEventAttendeeId_fkey" FOREIGN KEY ("candidate_event_attendee_id") REFERENCES "event_attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_feedback" ADD CONSTRAINT "message_feedback_messageId_fkey" FOREIGN KEY ("message_id") REFERENCES "concierge_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
