import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('creates event and attendee, then filters attendees by role and skill', () => {
    const event = service.createEvent({ name: 'MyConnect Summit' });

    service.addAttendee(event.id, {
      name: 'Ayu',
      role: 'Engineer',
      skills: ['nestjs', 'ai'],
    });

    service.addAttendee(event.id, {
      name: 'Budi',
      role: 'Founder',
      skills: ['sales', 'ai'],
    });

    const result = service.listAttendees(event.id, {
      page: 1,
      limit: 10,
      role: 'Engineer',
      skills: 'nestjs',
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Ayu');
    expect(result.meta.total).toBe(1);
  });

  it('throws not found when event does not exist', () => {
    expect(() =>
      service.listAttendees('missing-event', {
        page: 1,
        limit: 10,
      }),
    ).toThrow(NotFoundException);
  });
});
