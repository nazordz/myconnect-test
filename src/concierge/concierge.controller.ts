import { Body, Controller, Param, Post } from '@nestjs/common';
import { ConciergeService } from './concierge.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreateConciergeMessageDto } from './dto/create-concierge-message.dto';

@Controller('events/:id/concierge/messages')
export class ConciergeController {
  constructor(private readonly conciergeService: ConciergeService) {}

  @Post()
  sendMessage(
    @Param('id') eventId: string,
    @Body() dto: CreateConciergeMessageDto,
  ) {
    return this.conciergeService.sendMessage(eventId, dto);
  }

  @Post(':messageId/feedback')
  createFeedback(
    @Param('id') eventId: string,
    @Param('messageId') messageId: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.conciergeService.createFeedback(eventId, messageId, dto);
  }
}
