import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let controller: EventsController;

  const eventsServiceMock = {
    createEvent: jest.fn(),
    addAttendee: jest.fn(),
    listAttendees: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: eventsServiceMock }],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    jest.clearAllMocks();
  });

  it('forwards create event payload to service', () => {
    eventsServiceMock.createEvent.mockReturnValue({ id: 'event-1' });

    const output = controller.createEvent({ name: 'Conf' });

    expect(eventsServiceMock.createEvent).toHaveBeenCalledWith({
      name: 'Conf',
    });
    expect(output).toEqual({ id: 'event-1' });
  });
});
