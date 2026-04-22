import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from '../events/events.service';
import { OpenAiService } from '../openai/openai.service';
import { ConciergeService } from './concierge.service';

describe('ConciergeService', () => {
  let service: ConciergeService;
  let eventsService: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConciergeService,
        EventsService,
        {
          provide: OpenAiService,
          useValue: {
            getClient: () => ({ constructor: { name: 'OpenAI' } }),
          },
        },
      ],
    }).compile();

    service = module.get<ConciergeService>(ConciergeService);
    eventsService = module.get<EventsService>(EventsService);
  });

  it('returns ranked matches when sending a concierge message', () => {
    const event = eventsService.createEvent({ name: 'MyConnect' });
    const requester = eventsService.addAttendee(event.id, {
      name: 'Rina',
      role: 'Engineer',
      skills: ['nestjs', 'ai'],
    });

    eventsService.addAttendee(event.id, {
      name: 'Dewi',
      role: 'PM',
      skills: ['ai', 'product'],
    });

    const response = service.sendMessage(event.id, {
      attendee_id: requester.id,
      message: 'Carikan koneksi AI',
    });

    expect(response.matches.length).toBeGreaterThan(0);
    expect(response.assistant_response).toContain('kandidat');
    expect(response.provider).toBe('OpenAI');
  });
});
