import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;

  const prismaMock = {
    event: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    attendee: {
      create: jest.fn(),
    },
    eventAttendee: {
      upsert: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('creates an event', async () => {
    (prismaMock.event.create as jest.Mock).mockResolvedValue({ id: 'event-1' });

    const result = await service.createEvent({
      title: 'Demo Event',
      startAt: '2026-05-01T10:00:00.000Z',
      endAt: '2026-05-01T11:00:00.000Z',
      location: 'SF',
    });

    expect(result).toEqual({ id: 'event-1' });
    expect(prismaMock.event.create).toHaveBeenCalled();
  });

  it('creates an attendee for an event', async () => {
    (prismaMock.event.findUnique as jest.Mock).mockResolvedValue({
      id: 'event-1',
    });
    (prismaMock.attendee.create as jest.Mock).mockResolvedValue({
      id: 'attendee-1',
    });
    (prismaMock.eventAttendee.upsert as jest.Mock).mockResolvedValue({
      id: 'link-1',
    });

    const result = await service.createAttendee('event-1', {
      name: 'Taylor',
      skills: ['nestjs', 'prisma'],
      openToChat: true,
    });

    expect(result).toEqual({ id: 'link-1' });
    expect(prismaMock.eventAttendee.upsert).toHaveBeenCalled();
  });

  it('lists attendees with pagination and filters', async () => {
    (prismaMock.event.findUnique as jest.Mock).mockResolvedValue({
      id: 'event-1',
    });
    (prismaMock.$transaction as jest.Mock).mockResolvedValue([
      1,
      [{ id: 'link-1', openToChat: true }],
    ]);

    const result = await service.listAttendees('event-1', {
      page: 1,
      pageSize: 10,
      openToChat: true,
      skill: 'nestjs',
      search: 'tay',
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });
});
