import { Test, TestingModule } from '@nestjs/testing';
import { OpenAiService } from '../openai/openai.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;
  const createEventMock = jest.fn();
  const findEventMock = jest.fn();
  const updateEventMock = jest.fn();
  const deleteEventMock = jest.fn();
  const createAttendeeMock = jest.fn();
  const countAttendeesMock = jest.fn();
  const findManyAttendeesMock = jest.fn();
  const findUniqueOrThrowAttendeeMock = jest.fn();
  const executeRawUnsafeMock = jest.fn();
  const transactionMock = jest.fn();
  const embedTextMock = jest.fn();

  const prismaMock = {
    event: {
      create: createEventMock,
      findUnique: findEventMock,
      update: updateEventMock,
      delete: deleteEventMock,
    },
    attendee: {
      create: createAttendeeMock,
      count: countAttendeesMock,
      findMany: findManyAttendeesMock,
      findUniqueOrThrow: findUniqueOrThrowAttendeeMock,
    },
    $transaction: transactionMock,
  };

  const txMock = {
    attendee: {
      create: createAttendeeMock,
    },
    $executeRawUnsafe: executeRawUnsafeMock,
  };

  const openAiMock = {
    embedText: embedTextMock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    transactionMock.mockImplementation(
      (
        input: ((tx: typeof txMock) => Promise<unknown>) | Promise<unknown>[],
      ) => {
        if (typeof input === 'function') {
          return input(txMock);
        }
        return Promise.all(input);
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: OpenAiService,
          useValue: openAiMock,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('creates an event', async () => {
    createEventMock.mockResolvedValue({ id: 'event-1' });

    const result = await service.createEvent({
      title: 'Demo Event',
      startAt: '2026-05-01T10:00:00.000Z',
      endAt: '2026-05-01T11:00:00.000Z',
      location: 'SF',
    });

    expect(result).toEqual({ id: 'event-1' });
    expect(createEventMock).toHaveBeenCalled();
  });

  it('creates an attendee for an event', async () => {
    findEventMock.mockResolvedValue({
      id: 'event-1',
    });
    embedTextMock.mockResolvedValue([0.1, 0.2]);
    createAttendeeMock.mockResolvedValue({
      id: 'attendee-1',
    });
    findUniqueOrThrowAttendeeMock.mockResolvedValue({
      id: 'attendee-1',
    });

    const result = await service.createAttendee('event-1', {
      name: 'Taylor',
      skills: ['nestjs', 'prisma'],
      openToChat: true,
    });
    const expectedProfileText = [
      'name: Taylor',
      'headline: undefined',
      'bio: undefined',
      'Skills: nestjs, prisma',
      'Open to chat: yes',
    ].join('\n');

    expect(result).toEqual({ id: 'attendee-1' });
    expect(embedTextMock).toHaveBeenCalledWith(expectedProfileText);
    expect(createAttendeeMock).toHaveBeenCalledWith({
      data: {
        eventId: 'event-1',
        name: 'Taylor',
        headline: undefined,
        bio: undefined,
        company: undefined,
        role: undefined,
        skills: ['nestjs', 'prisma'],
        lookingFor: undefined,
        openToChat: true,
        profileText: expectedProfileText,
      },
    });
    expect(executeRawUnsafeMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE attendees'),
      '[0.1,0.2]',
      'text-embedding-3-small',
      expect.any(Date),
      'attendee-1',
    );
    expect(findUniqueOrThrowAttendeeMock).toHaveBeenCalledWith({
      where: { id: 'attendee-1' },
    });
  });

  it('updates an event', async () => {
    findEventMock.mockResolvedValue({
      id: 'event-1',
      startAt: new Date('2026-05-01T10:00:00.000Z'),
      endAt: new Date('2026-05-01T11:00:00.000Z'),
    });
    updateEventMock.mockResolvedValue({
      id: 'event-1',
      title: 'Updated Event',
    });

    const result = await service.updateEvent('event-1', {
      title: 'Updated Event',
      endAt: '2026-05-01T12:00:00.000Z',
    });

    expect(result).toEqual({ id: 'event-1', title: 'Updated Event' });
    expect(updateEventMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: {
        title: 'Updated Event',
        endAt: new Date('2026-05-01T12:00:00.000Z'),
      },
    });
  });

  it('removes an event', async () => {
    findEventMock.mockResolvedValue({
      id: 'event-1',
    });
    deleteEventMock.mockResolvedValue({
      id: 'event-1',
    });

    const result = await service.removeEvent('event-1');

    expect(result).toEqual({ id: 'event-1' });
    expect(deleteEventMock).toHaveBeenCalledWith({
      where: { id: 'event-1' },
    });
  });

  it('lists attendees with pagination and filters', async () => {
    findEventMock.mockResolvedValue({
      id: 'event-1',
    });
    countAttendeesMock.mockResolvedValue(1);
    findManyAttendeesMock.mockResolvedValue([
      { id: 'link-1', openToChat: true },
    ]);

    const result = await service.listAttendees('event-1', {
      page: 1,
      pageSize: 10,
      openToChat: true,
      skills: 'nestjs',
      search: 'tay',
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(transactionMock).toHaveBeenCalled();
  });
});
