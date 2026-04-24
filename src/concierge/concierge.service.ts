import { Injectable, NotFoundException } from '@nestjs/common';
import { ToolCallStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFeedbackDto,
  CreateMatchSuggestionDto,
  CreateMessageDto,
  CreateToolCallDto,
} from './dto/create-message.dto';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class ConciergeService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertSession(dto: CreateSessionDto) {
    return this.prisma.conciergeSession.upsert({
      where: {
        eventId_eventAttendeeId: {
          eventId: dto.eventId,
          eventAttendeeId: dto.eventAttendeeId,
        },
      },
      create: {
        eventId: dto.eventId,
        eventAttendeeId: dto.eventAttendeeId,
      },
      update: {},
    });
  }

  async createMessage(sessionId: string, dto: CreateMessageDto) {
    await this.assertSessionExists(sessionId);

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.conciergeMessage.create({
        data: {
          sessionId,
          role: dto.role,
          content: dto.content,
          rawText: dto.rawText,
          requestId: dto.requestId,
          llmProvider: dto.llmProvider,
          llmModel: dto.llmModel,
          promptTokens: dto.promptTokens,
          completionTokens: dto.completionTokens,
          totalTokens: dto.totalTokens,
          latencyMs: dto.latencyMs,
        },
      });

      await tx.conciergeSession.update({
        where: { id: sessionId },
        data: { lastMessageAt: message.createdAt },
      });

      return message;
    });
  }

  async createToolCall(messageId: string, dto: CreateToolCallDto) {
    await this.assertMessageExists(messageId);

    return this.prisma.conciergeToolCall.create({
      data: {
        messageId,
        toolName: dto.toolName,
        toolCallId: dto.toolCallId,
        status: dto.status,
        input: dto.input,
        output: dto.output,
        latencyMs: dto.latencyMs,
        errorMessage: dto.errorMessage,
      },
    });
  }

  async createMatchSuggestion(
    messageId: string,
    dto: CreateMatchSuggestionDto,
  ) {
    await this.assertMessageExists(messageId);

    return this.prisma.matchSuggestion.create({
      data: {
        messageId,
        requesterEventAttendeeId: dto.requesterEventAttendeeId,
        candidateEventAttendeeId: dto.candidateEventAttendeeId,
        rank: dto.rank,
        score: dto.score,
        rationale: dto.rationale,
        sharedGround: dto.sharedGround,
        draftIntroMessage: dto.draftIntroMessage,
      },
    });
  }

  async createFeedback(messageId: string, dto: CreateFeedbackDto) {
    await this.assertMessageExists(messageId);

    return this.prisma.messageFeedback.create({
      data: {
        messageId,
        rating: dto.rating,
        notes: dto.notes,
      },
    });
  }

  private async assertSessionExists(sessionId: string): Promise<void> {
    const session = await this.prisma.conciergeSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
  }

  private async assertMessageExists(messageId: string): Promise<void> {
    const message = await this.prisma.conciergeMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }
  }
}
