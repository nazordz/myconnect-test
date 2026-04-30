import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiService } from '@/openai/openai.service';
import { PrismaService } from '@/prisma/prisma.service';
import { EventConciergeService } from './event-concierge.service';

describe('EventConciergeService', () => {
  let service: EventConciergeService;
  const parseMock = jest.fn();
  const getClientMock = jest.fn();
  const embedTextMock = jest.fn();
  const findAttendeeMock = jest.fn();
  const upsertSessionMock = jest.fn();
  const createMessageMock = jest.fn();
  const findManyMessagesMock = jest.fn();
  const createFeedbackMock = jest.fn();
  const queryRawUnsafeMock = jest.fn();

  const prismaMock = {
    attendee: {
      findFirst: findAttendeeMock,
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
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    getClientMock.mockReturnValue({
      responses: {
        parse: parseMock,
      },
    });
    findAttendeeMock.mockResolvedValue(attendee);
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

    const firstRequest = parseMock.mock.calls[0][0];
    const tools = firstRequest.tools;
    const searchAttendeesTool = tools.find(
      (tool) => tool.name === 'search_attendees',
    );
    const scoreMatchTool = tools.find((tool) => tool.name === 'score_match');
    const draftIntroTool = tools.find(
      (tool) => tool.name === 'draft_intro_message',
    );

    expect(new Set(searchAttendeesTool.parameters.required)).toEqual(
      new Set(Object.keys(searchAttendeesTool.parameters.properties)),
    );
    expect(searchAttendeesTool.parameters.additionalProperties).toBe(false);
    expect(searchAttendeesTool.parameters.properties.skills.type).toBe('array');
    expect(searchAttendeesTool.parameters.properties.limit.type).toBe('number');
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
    expect(draftIntroTool.parameters.required).toEqual([
      'event',
      'requester',
      'candidate_ids',
    ]);
    expect(draftIntroTool.parameters.additionalProperties).toBe(false);
    expect(draftIntroTool.parameters.properties.requester.required).toEqual([
      'attendeeId',
      'name',
      'headline',
      'company',
      'role',
      'skills',
      'lookingFor',
    ]);
    expect(draftIntroTool.parameters.properties.candidate_ids.type).toBe(
      'array',
    );
  });

  it('awaits search_attendees and returns tool output', async () => {
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
              eventId: 'event-1',
              attendeeId: 'attendee-1',
              limit: 3,
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
        attendee_id: 'candidate-1',
        name: 'Jordan',
        headline: 'AI Founder',
        company: 'Acme AI',
        role: 'Founder',
        skills: ['llm'],
        looking_for: 'Builders',
        bio: 'Building AI products.',
        search_score: 0.9,
        semantic_score: 0.8,
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
      3,
    );
    const secondRequest = parseMock.mock.calls[1][0];
    expect(secondRequest.previous_response_id).toBe('resp-1');
    expect(secondRequest.input[0]).toMatchObject({
      type: 'function_call_output',
      call_id: 'call-1',
    });
    expect(JSON.parse(secondRequest.input[0].output)).toEqual([
      expect.objectContaining({
        attendee_id: 'candidate-1',
        name: 'Jordan',
      }),
    ]);
  });
});
