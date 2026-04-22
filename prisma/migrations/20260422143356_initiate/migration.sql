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
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendees" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "attendeeId" UUID NOT NULL,
    "skills" TEXT[],
    "lookingFor" TEXT,
    "openToChat" BOOLEAN NOT NULL DEFAULT true,
    "profileText" TEXT,
    "embedding" vector(1536),
    "embeddingModel" TEXT,
    "embeddingUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concierge_sessions" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "eventAttendeeId" UUID NOT NULL,
    "status" "ConciergeSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastIntent" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concierge_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concierge_messages" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "role" "ConciergeMessageRole" NOT NULL,
    "content" JSONB NOT NULL,
    "rawText" TEXT,
    "requestId" TEXT,
    "llmProvider" "LlmProvider",
    "llmModel" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concierge_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concierge_tool_calls" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "toolName" TEXT NOT NULL,
    "toolCallId" TEXT,
    "status" "ToolCallStatus" NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "latencyMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concierge_tool_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_suggestions" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "requesterEventAttendeeId" UUID NOT NULL,
    "candidateEventAttendeeId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,
    "sharedGround" JSONB NOT NULL,
    "draftIntroMessage" TEXT,
    "searchScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_feedback" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_startAt_idx" ON "events"("startAt");

-- CreateIndex
CREATE INDEX "events_endAt_idx" ON "events"("endAt");

-- CreateIndex
CREATE INDEX "events_location_idx" ON "events"("location");

-- CreateIndex
CREATE INDEX "attendees_name_idx" ON "attendees"("name");

-- CreateIndex
CREATE INDEX "attendees_company_idx" ON "attendees"("company");

-- CreateIndex
CREATE INDEX "attendees_role_idx" ON "attendees"("role");

-- CreateIndex
CREATE INDEX "event_attendees_eventId_idx" ON "event_attendees"("eventId");

-- CreateIndex
CREATE INDEX "event_attendees_attendeeId_idx" ON "event_attendees"("attendeeId");

-- CreateIndex
CREATE INDEX "event_attendees_eventId_openToChat_idx" ON "event_attendees"("eventId", "openToChat");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_eventId_attendeeId_key" ON "event_attendees"("eventId", "attendeeId");

-- CreateIndex
CREATE INDEX "concierge_sessions_eventId_idx" ON "concierge_sessions"("eventId");

-- CreateIndex
CREATE INDEX "concierge_sessions_eventAttendeeId_idx" ON "concierge_sessions"("eventAttendeeId");

-- CreateIndex
CREATE INDEX "concierge_sessions_status_idx" ON "concierge_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "concierge_sessions_eventId_eventAttendeeId_key" ON "concierge_sessions"("eventId", "eventAttendeeId");

-- CreateIndex
CREATE INDEX "concierge_messages_sessionId_createdAt_idx" ON "concierge_messages"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "concierge_messages_requestId_idx" ON "concierge_messages"("requestId");

-- CreateIndex
CREATE INDEX "concierge_messages_role_idx" ON "concierge_messages"("role");

-- CreateIndex
CREATE INDEX "concierge_tool_calls_messageId_idx" ON "concierge_tool_calls"("messageId");

-- CreateIndex
CREATE INDEX "concierge_tool_calls_toolName_idx" ON "concierge_tool_calls"("toolName");

-- CreateIndex
CREATE INDEX "concierge_tool_calls_status_idx" ON "concierge_tool_calls"("status");

-- CreateIndex
CREATE INDEX "match_suggestions_messageId_idx" ON "match_suggestions"("messageId");

-- CreateIndex
CREATE INDEX "match_suggestions_requesterEventAttendeeId_idx" ON "match_suggestions"("requesterEventAttendeeId");

-- CreateIndex
CREATE INDEX "match_suggestions_candidateEventAttendeeId_idx" ON "match_suggestions"("candidateEventAttendeeId");

-- CreateIndex
CREATE INDEX "match_suggestions_score_idx" ON "match_suggestions"("score");

-- CreateIndex
CREATE INDEX "match_suggestions_rank_idx" ON "match_suggestions"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "match_suggestions_messageId_candidateEventAttendeeId_key" ON "match_suggestions"("messageId", "candidateEventAttendeeId");

-- CreateIndex
CREATE INDEX "message_feedback_messageId_idx" ON "message_feedback"("messageId");

-- CreateIndex
CREATE INDEX "message_feedback_rating_idx" ON "message_feedback"("rating");

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_sessions" ADD CONSTRAINT "concierge_sessions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_sessions" ADD CONSTRAINT "concierge_sessions_eventAttendeeId_fkey" FOREIGN KEY ("eventAttendeeId") REFERENCES "event_attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_messages" ADD CONSTRAINT "concierge_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "concierge_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concierge_tool_calls" ADD CONSTRAINT "concierge_tool_calls_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "concierge_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_suggestions" ADD CONSTRAINT "match_suggestions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "concierge_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_suggestions" ADD CONSTRAINT "match_suggestions_requesterEventAttendeeId_fkey" FOREIGN KEY ("requesterEventAttendeeId") REFERENCES "event_attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_suggestions" ADD CONSTRAINT "match_suggestions_candidateEventAttendeeId_fkey" FOREIGN KEY ("candidateEventAttendeeId") REFERENCES "event_attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_feedback" ADD CONSTRAINT "message_feedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "concierge_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
