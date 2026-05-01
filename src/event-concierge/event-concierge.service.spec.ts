import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiService } from '@/openai/openai.service';
import { PrismaService } from '@/prisma/prisma.service';
import { EventConciergeService } from './event-concierge.service';
import type {
  FunctionTool,
  Tool,
} from 'openai/resources/responses/responses.js';
import type { FunctionCallOutput } from './dto/input-tools';

type ConciergeParseRequest = {
  input: Array<FunctionCallOutput | { role: string; content: string }>;
  previous_response_id?: string;
  tools?: Tool[];
};

type ConciergeFunctionCall = {
  type: 'function_call';
  name: 'search_attendees' | 'score_match' | 'draft_intro_message';
  call_id: string;
  arguments: string;
};

type ConciergeParsedMessage = {
  text: string;
  intent: {
    goal: string;
    requesterProfile: {
      role: string;
      location: string | null;
    };
    targetAttendeeTypes: string[];
    domains: string[];
    keywords: string[];
    skills: string[];
    relationshipType: string;
  };
};

type ConciergeParseResponse = {
  id: string;
  output_parsed: unknown | null;
  output: ConciergeFunctionCall[];
  output_text: string;
  created_at?: number;
  completed_at?: number;
  usage?: unknown;
};

type JsonSchemaProperty = {
  type?: string;
  required?: string[];
  additionalProperties?: boolean;
  properties?: Record<string, JsonSchemaProperty>;
  items: JsonSchemaProperty;
};

type FunctionToolWithSchema = FunctionTool & {
  parameters: JsonSchemaProperty & {
    required: string[];
    additionalProperties: boolean;
    properties: Record<string, JsonSchemaProperty>;
  };
};

describe('EventConciergeService', () => {
  let service: EventConciergeService;
  const parseMock = jest.fn<
    Promise<ConciergeParseResponse>,
    [ConciergeParseRequest]
  >();
  const getClientMock = jest.fn();
  const embedTextMock = jest.fn();
  const findAttendeeMock = jest.fn();
  const findManyAttendeesMock = jest.fn();
  const upsertSessionMock = jest.fn();
  const createMessageMock = jest.fn();
  const findManyMessagesMock = jest.fn();
  const createFeedbackMock = jest.fn();
  const queryRawUnsafeMock = jest.fn();

  const prismaMock = {
    attendee: {
      findFirst: findAttendeeMock,
      findMany: findManyAttendeesMock,
    },
    conciergeSession: {
      upsert: upsertSessionMock,
    },
    conciergeMessage: {
      create: createMessageMock,
      findMany: findManyMessagesMock,
    },
    messageFeedback: {
      create: createFeedbackMock,
    },
    $queryRawUnsafe: queryRawUnsafeMock,
  };

  const attendee = {
    id: 'attendee-1',
    name: 'Taylor',
    headline: 'LLM Engineer',
    bio: 'Builds LLM products.',
    company: 'MyConnect',
    role: 'Engineer',
    skills: ['nestjs', 'llm'],
    lookingFor: 'AI founders',
    openToChat: true,
    profileText: 'Taylor builds LLM products.',
    event: {
      id: 'event-1',
      title: 'AI Summit',
      location: 'Jakarta',
      startAt: new Date('2026-05-01T09:00:00.000Z'),
      endAt: new Date('2026-05-01T17:00:00.000Z'),
    },
  };

  const parsedMessage = {
    text: 'Here are relevant matches.',
    intent: {
      goal: 'Find AI founders',
      requesterProfile: {
        role: 'Engineer',
        location: null,
      },
      targetAttendeeTypes: ['founder'],
      domains: ['AI'],
      keywords: ['llm'],
      skills: ['nestjs'],
      relationshipType: 'networking',
    },
  } satisfies ConciergeParsedMessage;

  const getParseRequest = (callIndex: number) => {
    const call = parseMock.mock.calls[callIndex];
    if (!call) {
      throw new Error(`Expected parse call ${callIndex} to exist`);
    }
    return call[0];
  };

  const getFunctionTool = (
    request: ConciergeParseRequest,
    name: FunctionTool['name'],
  ): FunctionToolWithSchema => {
    const tool = request.tools?.find(
      (item): item is FunctionTool =>
        item.type === 'function' && item.name === name,
    );
    if (!tool?.parameters) {
      throw new Error(`Expected ${name} tool with parameters`);
    }
    return tool as FunctionToolWithSchema;
  };

  const getFirstFunctionCallOutput = (
    request: ConciergeParseRequest,
  ): FunctionCallOutput => {
    const input = request.input[0];
    if (!input || !('type' in input) || input.type !== 'function_call_output') {
      throw new Error('Expected first input item to be function_call_output');
    }
    return input;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    getClientMock.mockReturnValue({
      responses: {
        parse: parseMock,
      },
    });
    findAttendeeMock.mockResolvedValue(attendee);
    findManyAttendeesMock.mockResolvedValue([]);
    upsertSessionMock.mockResolvedValue({ id: 'session-1' });
    createMessageMock.mockResolvedValue({ id: 'message-1' });
    findManyMessagesMock.mockResolvedValue([
      {
        role: 'USER',
        message: 'Find AI founders',
      },
    ]);
    parseMock.mockResolvedValue({
      id: 'resp-1',
      output_parsed: parsedMessage,
      output: [],
      output_text: parsedMessage.text,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventConciergeService,
        {
          provide: OpenAiService,
          useValue: {
            getClient: getClientMock,
            embedText: embedTextMock,
          },
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<EventConciergeService>(EventConciergeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('declares strict tool schemas accepted by Responses function calling', async () => {
    await service.sendMessage('event-1', {
      attendeeId: 'attendee-1',
      message: 'Find AI founders',
    });

    const firstRequest = getParseRequest(0);
    const searchAttendeesTool = getFunctionTool(
      firstRequest,
      'search_attendees',
    );
    const scoreMatchTool = getFunctionTool(firstRequest, 'score_match');
    const draftIntroTool = getFunctionTool(firstRequest, 'draft_intro_message');

    expect(new Set(searchAttendeesTool.parameters.required)).toEqual(
      new Set(Object.keys(searchAttendeesTool.parameters.properties)),
    );
    expect(searchAttendeesTool.parameters.additionalProperties).toBe(false);
    expect(searchAttendeesTool.parameters.properties.skills.type).toBe('array');
    expect(searchAttendeesTool.parameters.properties.limit.type).toBe('number');
    expect(searchAttendeesTool.parameters.properties.eventId).toBeUndefined();
    expect(
      searchAttendeesTool.parameters.properties.attendeeId,
    ).toBeUndefined();
    expect(scoreMatchTool.parameters.required).toEqual([
      'event',
      'requester',
      'candidates',
      'userMessage',
    ]);
    expect(scoreMatchTool.parameters.additionalProperties).toBe(false);
    expect(scoreMatchTool.parameters.properties.requester.required).toEqual([
      'attendeeId',
      'name',
      'headline',
      'bio',
      'company',
      'role',
      'skills',
      'lookingFor',
    ]);
    expect(
      scoreMatchTool.parameters.properties.candidates.items.required,
    ).toEqual([
      'attendeeId',
      'name',
      'headline',
      'bio',
      'company',
      'role',
      'skills',
      'lookingFor',
      'finalScore',
    ]);
    expect(draftIntroTool.parameters.required).toEqual(['candidate_ids']);
    expect(draftIntroTool.parameters.additionalProperties).toBe(false);
    expect(draftIntroTool.parameters.properties.event).toBeUndefined();
    expect(draftIntroTool.parameters.properties.requester).toBeUndefined();
    expect(draftIntroTool.parameters.properties.candidate_ids.type).toBe(
      'array',
    );
  });

  it('awaits search_attendees with server scope and clamped limit', async () => {
    parseMock
      .mockResolvedValueOnce({
        id: 'resp-1',
        output_parsed: null,
        output: [
          {
            type: 'function_call',
            name: 'search_attendees',
            call_id: 'call-1',
            arguments: JSON.stringify({
              lookingFor: 'AI founders',
              skills: ['llm'],
              eventId: 'malicious-event',
              attendeeId: 'malicious-attendee',
              limit: 999,
            }),
          },
        ],
        output_text: '',
      })
      .mockResolvedValueOnce({
        id: 'resp-2',
        output_parsed: parsedMessage,
        output: [],
        output_text: parsedMessage.text,
      });
    embedTextMock.mockResolvedValue([0.1, 0.2]);
    queryRawUnsafeMock.mockResolvedValue([
      {
        id: 'candidate-1',
        name: 'Jordan',
        headline: 'AI Founder',
        company: 'Acme AI',
        role: 'Founder',
        skills: ['llm'],
        looking_for: 'Builders',
        bio: 'Building AI products.',
        search_score: 0.9,
        semanticScore: 0.8,
        skill_overlap_score: 1,
        keyword_score: 1,
      },
    ]);

    const result = await service.sendMessage('event-1', {
      attendeeId: 'attendee-1',
      message: 'Find AI founders',
    });

    expect(result).toEqual(parsedMessage);
    expect(queryRawUnsafeMock).toHaveBeenCalledWith(
      expect.any(String),
      '[0.1,0.2]',
      'event-1',
      'attendee-1',
      ['llm'],
      'AI founders',
      10,
    );
    const secondRequest = getParseRequest(1);
    const functionCallOutput = getFirstFunctionCallOutput(secondRequest);

    expect(secondRequest.previous_response_id).toBe('resp-1');
    expect(functionCallOutput).toMatchObject({
      type: 'function_call_output',
      call_id: 'call-1',
    });
    expect(JSON.parse(functionCallOutput.output) as unknown).toEqual([
      expect.objectContaining({
        id: 'candidate-1',
        name: 'Jordan',
      }),
    ]);
  });

  it('fetches grounded candidate facts before drafting intro messages', async () => {
    parseMock
      .mockResolvedValueOnce({
        id: 'resp-1',
        output_parsed: null,
        output: [
          {
            type: 'function_call',
            name: 'draft_intro_message',
            call_id: 'call-1',
            arguments: JSON.stringify({
              candidate_ids: ['candidate-1', 'candidate-2', 'attendee-1'],
            }),
          },
        ],
        output_text: '',
      })
      .mockResolvedValueOnce({
        id: 'resp-draft',
        output_parsed: {
          messages: [
            {
              attendeeId: 'candidate-1',
              content: 'Hi Jordan, I noticed your AI work.',
            },
          ],
        },
        output: [],
        output_text: '',
        usage: { total_tokens: 42 },
      })
      .mockResolvedValueOnce({
        id: 'resp-2',
        output_parsed: parsedMessage,
        output: [],
        output_text: parsedMessage.text,
      });
    findManyAttendeesMock.mockResolvedValue([
      {
        id: 'candidate-1',
        name: 'Jordan',
        headline: 'AI Founder',
        bio: 'Building AI products.',
        company: 'Acme AI',
        role: 'Founder',
        skills: ['llm'],
        lookingFor: 'Backend co-founder',
      },
    ]);

    const result = await service.sendMessage('event-1', {
      attendeeId: 'attendee-1',
      message: 'Draft intro for Jordan',
    });

    expect(result).toEqual(parsedMessage);
    expect(findManyAttendeesMock).toHaveBeenCalledWith({
      where: {
        eventId: 'event-1',
        id: {
          in: ['candidate-1', 'candidate-2'],
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

    const draftRequest = getParseRequest(1);
    const draftInput = JSON.parse(
      (draftRequest.input[1] as { content: string }).content,
    ) as {
      requester: { attendeeId: string };
      candidates: Array<{ attendeeId: string; name: string }>;
    };

    expect(draftInput.requester.attendeeId).toBe('attendee-1');
    expect(draftInput.candidates).toEqual([
      expect.objectContaining({
        attendeeId: 'candidate-1',
        name: 'Jordan',
      }),
    ]);

    const finalRequest = getParseRequest(2);
    const functionCallOutput = getFirstFunctionCallOutput(finalRequest);
    expect(JSON.parse(functionCallOutput.output) as unknown).toEqual({
      messages: [
        {
          attendeeId: 'candidate-1',
          content: 'Hi Jordan, I noticed your AI work.',
        },
      ],
    });
  });
});
