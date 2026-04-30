import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { EventConciergeModule } from '../src/event-concierge/event-concierge.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { OpenAiService } from '../src/openai/openai.service';
import { EventConciergeService } from '../src/event-concierge/event-concierge.service';

type ConciergeRole = 'USER' | 'ASSISTANT';

type StoredConciergeMessage = {
  sessionId: string;
  role: ConciergeRole;
  message: string;
  createdAt: Date;
};

const createOpenAiMock = () => {
  const parse = jest.fn();

  return {
    client: {
      responses: {
        parse,
      },
    },
    parse,
  };
};

const createPrismaMock = () => {
  const sessions = new Map<string, { id: string; eventId: string; attendeeId: string }>();
  const messages: StoredConciergeMessage[] = [];

  const attendee = {
    id: 'a32d9253-8b87-45f5-9d26-eb4dc02f374f',
    name: 'Alex Johnson',
    headline: 'Staff Engineer',
    bio: 'Enjoys building AI products',
    company: 'Acme Inc',
    role: 'Engineer',
    skills: ['TypeScript', 'AI'],
    lookingFor: 'Product-minded engineers to collaborate with',
    openToChat: true,
    event: {
      id: '98379c63-f0ef-4b3e-b4d1-af16f71f6848',
      name: 'Founder Summit',
      location: 'SF',
      startsAt: new Date('2026-01-01T09:00:00.000Z'),
      endsAt: new Date('2026-01-01T18:00:00.000Z'),
    },
  };

  const mock = {
    attendee: {
      findFirst: jest.fn(async () => attendee),
    },
    conciergeSession: {
      upsert: jest.fn(async ({ where, create }: any) => {
        const key = `${where.eventId_attendeeId.eventId}:${where.eventId_attendeeId.attendeeId}`;
        const existing = sessions.get(key);
        if (existing) {
          return existing;
        }

        const created = {
          id: '4a6ef2d9-84a8-4e9d-9f41-9f5d32741767',
          eventId: create.eventId,
          attendeeId: create.attendeeId,
        };
        sessions.set(key, created);
        return created;
      }),
    },
    conciergeMessage: {
      create: jest.fn(async ({ data }: any) => {
        const saved = {
          sessionId: data.sessionId,
          role: data.role,
          message: data.message,
          createdAt: new Date(),
        };
        messages.push(saved);
        return saved;
      }),
      findMany: jest.fn(async ({ where }: any) =>
        messages
          .filter((m) => m.sessionId === where.sessionId)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      ),
    },
    __state: {
      sessions,
      messages,
    },
  };

  return mock;
};

describe('EventConciergeController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let parseMock: jest.Mock;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    const openAiMock = createOpenAiMock();
    parseMock = openAiMock.parse;

    const firstResponseId = 'resp_first_123';
    const searchToolPayload = {
      attendees: [
        {
          id: 'candidate-1',
          name: 'Taylor Rivera',
          headline: 'Product Lead',
        },
      ],
    };

    // First LLM turn requests a backend tool call.
    parseMock.mockResolvedValueOnce({
      id: firstResponseId,
      created_at: 100,
      completed_at: 101,
      output_parsed: null,
      usage: {},
      output: [
        {
          type: 'function_call',
          name: 'search_attendees',
          call_id: 'call_search_1',
          arguments: JSON.stringify({
            lookingFor: 'people with GTM experience',
            skills: ['sales', 'partnerships'],
            limit: 5,
          }),
        },
      ],
    });

    // Second LLM turn returns the final structured response.
    parseMock.mockResolvedValueOnce({
      id: 'resp_final_456',
      created_at: 102,
      completed_at: 103,
      usage: {},
      output: [],
      output_parsed: {
        text: 'Here are 2 people worth talking to...',
      },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EventConciergeModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(OpenAiService)
      .useValue({
        getClient: () => openAiMock.client,
        embedText: jest.fn(),
      })
      .compile();

    const conciergeService = moduleFixture.get(EventConciergeService);
    // Mock the backend tool result that will be serialized and sent back to OpenAI.
    jest
      .spyOn(conciergeService as any, 'toolSearchAttendees')
      .mockResolvedValue(searchToolPayload);

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('should process concierge message and return final recommendation summary', async () => {
    const eventId = '98379c63-f0ef-4b3e-b4d1-af16f71f6848';
    const body = {
      attendeeId: 'a32d9253-8b87-45f5-9d26-eb4dc02f374f',
      message: 'Who should I talk to for distribution partnerships?',
    };

    // 1) Execute the full HTTP flow through the controller and service.
    const response = await request(app.getHttpServer())
      .post(`/events/${eventId}/concierge/messages`)
      .send(body)
      .expect(200);

    // 2) Verify the parsed assistant response is returned to API consumers.
    expect(response.body).toEqual({
      text: 'Here are 2 people worth talking to...',
    });

    // 3) Verify a concierge session was upserted for event+attendee.
    expect(prismaMock.conciergeSession.upsert).toHaveBeenCalledTimes(1);
    expect(prismaMock.__state.sessions.size).toBe(1);

    // 4) Verify both user and assistant messages were stored.
    const storedRoles = prismaMock.__state.messages.map((m) => m.role);
    expect(storedRoles).toEqual(['USER', 'ASSISTANT']);
    expect(prismaMock.__state.messages[0]?.message).toBe(body.message);
    expect(prismaMock.__state.messages[1]?.message).toBe(
      'Here are 2 people worth talking to...',
    );

    // 5) OpenAI should be called twice: first tool request, second final response.
    expect(parseMock).toHaveBeenCalledTimes(2);

    // 6) Second call must include previous_response_id to continue tool-call thread.
    const secondCallArgs = parseMock.mock.calls[1][0];
    expect(secondCallArgs.previous_response_id).toBe('resp_first_123');

    // 7) Verify tool output sent back to OpenAI includes serialized search_attendees result.
    expect(secondCallArgs.input).toEqual([
      {
        type: 'function_call_output',
        call_id: 'call_search_1',
        output: JSON.stringify({
          attendees: [
            {
              id: 'candidate-1',
              name: 'Taylor Rivera',
              headline: 'Product Lead',
            },
          ],
        }),
      },
    ]);
  });
});
