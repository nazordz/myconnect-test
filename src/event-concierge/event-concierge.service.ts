import { OpenAiService } from '@/openai/openai.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message';
import { zodTextFormat } from 'openai/helpers/zod.js';
import type { ConciergeMessageRole } from '@/generated/prisma/client';
import type {
  ParsedResponseFunctionToolCall,
  ResponseInput,
} from 'openai/resources/responses/responses.js';
import {
  AttendeeProfile,
  DraftIntroMessageInput,
  DraftIntroMessageParams,
  FunctionCallOutput,
  LogToolCall,
  ScoreMatchParams,
  SearchAttendeeRow,
  SearchAttendeesParams,
  ToolScope,
} from './dto/input-tools';
import {
  ConciergeMessageSchema,
  DraftIntroMessageResultSchema,
  ScoreMatchResultSchema,
} from './agent/event-concierge.schemas';
import {
  buildConciergeSystemInstructions,
  draftIntroMessageSystemPrompt,
  scoreMatchSystemPrompt,
} from './agent/event-concierge.prompts';
import { conciergeToolDefinitions } from './agent/event-concierge.tool-definitions';

type OpenAiMessageRole = Lowercase<ConciergeMessageRole>;

const conciergeMessageRoleToOpenAiRole = {
  SYSTEM: 'system',
  USER: 'user',
  ASSISTANT: 'assistant',
  DEVELOPER: 'developer',
} satisfies Record<ConciergeMessageRole, OpenAiMessageRole>;

const elapsedMs = (startedAt: number) => Date.now() - startedAt;
const DEFAULT_SEARCH_LIMIT = 5;
const MAX_SEARCH_LIMIT = 10;

type AttendeeProfileSource = {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  company: string | null;
  role: string | null;
  skills: string[] | null;
  lookingFor: string | null;
};

@Injectable()
export class EventConciergeService {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly prisma: PrismaService,
  ) {}

  async sendMessage(eventId: string, dto: CreateMessageDto) {
    const attendee = await this.prisma.attendee.findFirst({
      where: {
        eventId,
        id: dto.attendeeId,
      },
      select: {
        id: true,
        name: true,
        headline: true,
        bio: true,
        company: true,
        role: true,
        skills: true,
        lookingFor: true,
        openToChat: false,
        event: true,
      },
    });
    if (!attendee) {
      throw new NotFoundException(
        `Attendee ${dto.attendeeId} not found for event ${eventId}`,
      );
    }
    const toolScope: ToolScope = {
      eventId,
      attendeeId: attendee.id,
    };
    const requesterProfile = this.toAttendeeProfile(attendee);
    const conciergeSession = await this.prisma.conciergeSession.upsert({
      where: {
        eventId_attendeeId: {
          eventId: eventId,
          attendeeId: attendee.id,
        },
      },
      create: {
        attendeeId: attendee.id,
        eventId,
      },
      update: {},
    });

    await this.prisma.conciergeMessage.create({
      data: {
        sessionId: conciergeSession.id,
        role: 'USER',
        message: dto.message,
      },
    });

    const systemInstructions = buildConciergeSystemInstructions(attendee);
    const historyMessages = await this.prisma.conciergeMessage.findMany({
      where: {
        sessionId: conciergeSession.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 10,
    });
    const inputMessages: ResponseInput = [
      ...systemInstructions,
      ...historyMessages.map((item) => ({
        role: this.mapConciergeMessageRoleToOpenAiRole(item.role),
        content: item.message,
      })),
    ];
    const toolCalls: LogToolCall[] = [];

    const openai = this.openAiService.getClient();
    const startedAt = Date.now();
    let response = await openai.responses.parse({
      model: 'gpt-5.4-mini',
      input: inputMessages,
      reasoning: {
        effort: 'medium',
      },
      tools: conciergeToolDefinitions,
      store: true,
      text: {
        format: zodTextFormat(ConciergeMessageSchema, 'conciergeMessage'),
      },
    });
    toolCalls.push({
      request_id: response._request_id ?? '',
      tool_name: 'user sent message',
      concierge_message_id: '',
      latency: elapsedMs(startedAt),
      tokens: response.usage?.total_tokens ?? 0,
    });

    while (true) {
      const responseFunction = response.output.filter(
        (item): item is ParsedResponseFunctionToolCall =>
          item.type === 'function_call',
      );
      if (responseFunction.length === 0) {
        break;
      }
      const functionCallOutputs: FunctionCallOutput[] = [];

      for (const resFunc of responseFunction) {
        if (resFunc.name == 'search_attendees') {
          const searchAttendeesInput = JSON.parse(
            resFunc.arguments,
          ) as SearchAttendeesParams;
          Logger.log('searchAttendeesInput', searchAttendeesInput);
          const startedAt = Date.now();
          const outputSearchAttendees = await this.toolSearchAttendees(
            searchAttendeesInput,
            toolScope,
          );
          Logger.log('outputSearchAttendees', outputSearchAttendees);
          functionCallOutputs.push({
            type: 'function_call_output',
            call_id: resFunc.call_id,
            output: JSON.stringify(outputSearchAttendees),
          });
          toolCalls.push({
            request_id: '',
            tool_name: 'search_attendees',
            concierge_message_id: '',
            latency: elapsedMs(startedAt),
            tokens: 0,
          });
        }
        if (resFunc.name == 'score_match') {
          const scoreMatchInput = JSON.parse(
            resFunc.arguments,
          ) as ScoreMatchParams;
          Logger.log('scoreMatchInput', scoreMatchInput);
          const startedAt = Date.now();
          const outputScoreMatch = await this.toolScoreMatch(scoreMatchInput);
          Logger.log('outputScoreMatch', outputScoreMatch.output_parsed ?? '');
          functionCallOutputs.push({
            type: 'function_call_output',
            call_id: resFunc.call_id,
            output: JSON.stringify(outputScoreMatch.output_parsed),
          });
          toolCalls.push({
            request_id: outputScoreMatch._request_id ?? '',
            tool_name: 'scrore_match',
            concierge_message_id: '',
            latency: elapsedMs(startedAt),
            tokens: outputScoreMatch.usage?.total_tokens ?? 0,
          });
        }
        if (resFunc.name == 'draft_intro_message') {
          const draftIntroMessageInput = JSON.parse(
            resFunc.arguments,
          ) as DraftIntroMessageParams;
          Logger.log('draftIntroMessageInput', draftIntroMessageInput);
          const startedAt = Date.now();
          const outputDraftIntroMessage = await this.toolDraftIntroMessage(
            draftIntroMessageInput,
            toolScope,
            requesterProfile,
            attendee.event,
          );
          Logger.log(
            'outputDraftIntroMessage',
            outputDraftIntroMessage.output_parsed ?? '',
          );
          functionCallOutputs.push({
            type: 'function_call_output',
            call_id: resFunc.call_id,
            output: JSON.stringify(outputDraftIntroMessage.output_parsed),
          });
          toolCalls.push({
            request_id: outputDraftIntroMessage._request_id ?? '',
            tool_name: 'draft_intro_message',
            concierge_message_id: '',
            latency: elapsedMs(startedAt),
            tokens: outputDraftIntroMessage.usage?.total_tokens ?? 0,
          });
        }
      }
      const startedAt = Date.now();
      response = await openai.responses.parse({
        model: 'gpt-5.4-mini',
        input: functionCallOutputs,
        previous_response_id: response.id,
        reasoning: {
          effort: 'medium',
        },
        tools: conciergeToolDefinitions,
        text: {
          format: zodTextFormat(ConciergeMessageSchema, 'conciergeMessage'),
        },
      });
      toolCalls.push({
        request_id: response._request_id ?? '',
        tool_name: 'system processed message',
        concierge_message_id: '',
        latency: elapsedMs(startedAt),
        tokens: response.usage?.total_tokens ?? 0,
      });
    }

    const finalParsed = response.output_parsed;

    const newConciergeMessage = await this.prisma.conciergeMessage.create({
      data: {
        sessionId: conciergeSession.id,
        role: 'ASSISTANT',
        message: finalParsed?.text ?? '',
      },
    });
    toolCalls.map((toolCall) => {
      toolCall.concierge_message_id = newConciergeMessage.id;
      return toolCall;
    });

    // store to CloudWatch
    for (const toolCall of toolCalls) {
      Logger.log('toolCall', toolCall);
    }
    return finalParsed;
  }

  private mapConciergeMessageRoleToOpenAiRole(
    role: ConciergeMessageRole,
  ): OpenAiMessageRole {
    return conciergeMessageRoleToOpenAiRole[role];
  }

  private toAttendeeProfile(source: AttendeeProfileSource): AttendeeProfile {
    return {
      attendeeId: source.id,
      name: source.name,
      headline: source.headline ?? '',
      bio: source.bio ?? '',
      company: source.company ?? '',
      role: source.role ?? '',
      skills: source.skills ?? [],
      lookingFor: source.lookingFor ?? '',
    };
  }

  private normalizeSearchLimit(limit: number | null) {
    if (limit == null || !Number.isFinite(limit)) {
      return DEFAULT_SEARCH_LIMIT;
    }
    return Math.min(Math.max(Math.trunc(limit), 1), MAX_SEARCH_LIMIT);
  }

  private async toolSearchAttendees(
    params: SearchAttendeesParams,
    scope: ToolScope,
  ) {
    const limit = this.normalizeSearchLimit(params.limit);
    const lookingForEmbed = await this.openAiService.embedText(
      params.lookingFor,
    );
    const normalizedSkills = (params.skills ?? [])
      .map((s) => s.trim())
      .filter(Boolean);
    const vectorLiteral = `[${lookingForEmbed.join(',')}]`;
    const rows = await this.prisma.$queryRawUnsafe<SearchAttendeeRow[]>(
      `
      SELECT
        a.id,
        a.name,
        a.headline,
        a.company,
        a.role,
        a.skills,
        a.looking_for,
        a.bio,

        GREATEST(0, 1 - (a.embedding <=> $1::vector(1536))) AS semanticScore,

        CASE
          WHEN cardinality($4::text[]) = 0 THEN 0
          ELSE (
            SELECT COUNT(*)::int
            FROM unnest(a.skills) s
            WHERE lower(s) = ANY (
              SELECT lower(x) FROM unnest($4::text[]) x
            )
          )
        END AS skillOverlapScore,

        CASE
          WHEN $5::text IS NULL OR $5::text = '' THEN 0
          WHEN COALESCE(a.looking_for, '') ILIKE '%' || $5 || '%' THEN 1
          ELSE 0
        END AS lookingForMatchScore,

        (
          GREATEST(0, 1 - (a.embedding <=> $1::vector(1536))) * 0.75
          +
          (
            CASE
              WHEN cardinality($4::text[]) = 0 THEN 0
              ELSE (
                (
                  SELECT COUNT(*)
                  FROM unnest(a.skills) s
                  WHERE lower(s) = ANY (
                    SELECT lower(x) FROM unnest($4::text[]) x
                  )
                )::float / GREATEST(cardinality($4::text[]), 1)
              )
            END
          ) * 0.20
          +
          (
            CASE
              WHEN $5::text IS NULL OR $5::text = '' THEN 0
              WHEN COALESCE(a.looking_for, '') ILIKE '%' || $5 || '%' THEN 1
              ELSE 0
            END
          ) * 0.05
        )::float AS finalScore

      FROM attendees a
      WHERE
        a.event_id = $2::uuid
        AND a.id <> $3::uuid
        AND a.open_to_chat = true
        AND a.embedding IS NOT NULL

      ORDER BY finalScore DESC
      LIMIT $6
      `,
      vectorLiteral,
      scope.eventId,
      scope.attendeeId,
      normalizedSkills,
      params.lookingFor,
      limit,
    );
    return rows;
  }

  private async toolScoreMatch(input: ScoreMatchParams) {
    const openai = this.openAiService.getClient();
    const response = await openai.responses.parse({
      model: 'gpt-5.4-mini',
      reasoning: {
        effort: 'medium',
      },
      input: [
        {
          role: 'system',
          content: scoreMatchSystemPrompt,
        },
        {
          role: 'user',
          content: JSON.stringify(input),
        },
      ],
      text: {
        format: zodTextFormat(ScoreMatchResultSchema, 'scoreMatchResult'),
      },
    });
    return response;
  }

  private async toolDraftIntroMessage(
    input: DraftIntroMessageParams,
    scope: ToolScope,
    requester: AttendeeProfile,
    event: DraftIntroMessageInput['event'],
  ) {
    const candidateIds = [...new Set(input.candidate_ids)]
      .map((id) => id.trim())
      .filter((id) => id && id !== scope.attendeeId);
    if (candidateIds.length === 0) {
      return {
        _request_id: '',
        output_parsed: { messages: [] },
        usage: null,
      };
    }
    const candidateRows = await this.prisma.attendee.findMany({
      where: {
        eventId: scope.eventId,
        id: {
          in: candidateIds,
        },
        openToChat: true,
      },
      select: {
        id: true,
        name: true,
        headline: true,
        bio: true,
        company: true,
        role: true,
        skills: true,
        lookingFor: true,
      },
    });
    const candidates = candidateRows.map((candidate) =>
      this.toAttendeeProfile(candidate),
    );
    if (candidates.length === 0) {
      return {
        _request_id: '',
        output_parsed: { messages: [] },
        usage: null,
      };
    }
    const groundedInput: DraftIntroMessageInput = {
      event,
      requester,
      candidates,
    };
    const openai = this.openAiService.getClient();
    const response = await openai.responses.parse({
      model: 'gpt-5.4-mini',
      reasoning: {
        effort: 'low',
      },
      input: [
        {
          role: 'system',
          content: draftIntroMessageSystemPrompt,
        },
        {
          role: 'user',
          content: JSON.stringify(groundedInput),
        },
      ],
      text: {
        format: zodTextFormat(
          DraftIntroMessageResultSchema,
          'draftIntroMessageResult',
        ),
      },
    });

    const serverDuration =
      response.completed_at == null
        ? null
        : response.completed_at - response.created_at;
    Logger.log(`toolDraftIntroMessage server duration: ${serverDuration}`);
    Logger.log('toolDraftIntroMessage usage', response.usage);
    return response;
  }

  async createFeedback(messageId: string, dto: CreateFeedbackDto) {
    return this.prisma.messageFeedback.create({
      data: {
        messageId,
        rating: dto.rating,
        notes: dto.notes,
      },
    });
  }
}
