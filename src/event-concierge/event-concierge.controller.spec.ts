import { Test, TestingModule } from '@nestjs/testing';
import { EventConciergeController } from './event-concierge.controller';
import { EventConciergeService } from './event-concierge.service';

describe('EventConciergeController', () => {
  let controller: EventConciergeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventConciergeController],
      providers: [
        {
          provide: EventConciergeService,
          useValue: {
            sendMessage: jest.fn(),
            createFeedback: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EventConciergeController>(EventConciergeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
