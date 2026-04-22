import { Test, TestingModule } from '@nestjs/testing';
import { ConciergeController } from './concierge.controller';
import { ConciergeService } from './concierge.service';

describe('ConciergeController', () => {
  let controller: ConciergeController;

  const conciergeServiceMock = {
    sendMessage: jest.fn(),
    createFeedback: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConciergeController],
      providers: [
        { provide: ConciergeService, useValue: conciergeServiceMock },
      ],
    }).compile();

    controller = module.get<ConciergeController>(ConciergeController);
    jest.clearAllMocks();
  });

  it('forwards message to concierge service', () => {
    conciergeServiceMock.sendMessage.mockReturnValue({ id: 'msg-1' });

    const result = controller.sendMessage('event-1', {
      attendee_id: 'att-1',
      message: 'Find matches',
    });

    expect(conciergeServiceMock.sendMessage).toHaveBeenCalledWith('event-1', {
      attendee_id: 'att-1',
      message: 'Find matches',
    });
    expect(result).toEqual({ id: 'msg-1' });
  });
});
