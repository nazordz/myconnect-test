import { Test, TestingModule } from '@nestjs/testing';
import { ConciergeMessageRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConciergeService } from './concierge.service';

describe('ConciergeService', () => {
  let service: ConciergeService;

  const prismaMock = {
    conciergeSession: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    conciergeMessage: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    messageFeedback: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConciergeService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ConciergeService>(ConciergeService);
  });

  it('persists concierge messages', async () => {
    (prismaMock.conciergeSession.findUnique as jest.Mock).mockResolvedValue({
      id: 'session-1',
    });
    (prismaMock.$transaction as jest.Mock).mockImplementation(
      async (callback) =>
        callback({
          conciergeMessage: {
            create: jest.fn().mockResolvedValue({
              id: 'message-1',
              createdAt: new Date('2026-06-01T10:00:00.000Z'),
            }),
          },
          conciergeSession: {
            update: jest.fn().mockResolvedValue({ id: 'session-1' }),
          },
        }),
    );

    const result = await service.createMessage('session-1', {
      role: ConciergeMessageRole.USER,
      content: { text: 'hello' },
    });

    expect(result.id).toBe('message-1');
  });

  it('persists feedback', async () => {
    (prismaMock.conciergeMessage.findUnique as jest.Mock).mockResolvedValue({
      id: 'message-1',
    });
    (prismaMock.messageFeedback.create as jest.Mock).mockResolvedValue({
      id: 'feedback-1',
    });

    const result = await service.createFeedback('message-1', {
      rating: 5,
      notes: 'great',
    });

    expect(result.id).toBe('feedback-1');
    expect(prismaMock.messageFeedback.create).toHaveBeenCalled();
  });
});
