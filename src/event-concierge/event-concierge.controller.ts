import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { EventConciergeService } from './event-concierge.service';

@Controller()
export class EventConciergeController {
  constructor(private readonly eventConciergeService: EventConciergeService) {}
  @Post('/events/:id/concierge/messages')
  createChat(
    @Param('id', new ParseUUIDPipe()) eventId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.eventConciergeService.sendMessage(eventId, dto);
  }

  @Post('messages/:messageId/feedback')
  createFeedback(
    @Param('messageId', new ParseUUIDPipe()) messageId: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.eventConciergeService.createFeedback(messageId, dto);
  }
}
