import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  CreateFeedbackDto,
  CreateMatchSuggestionDto,
  CreateMessageDto,
  CreateToolCallDto,
} from './dto/create-message.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { ConciergeService } from './concierge.service';

@Controller('concierge')
export class ConciergeController {
  constructor(private readonly conciergeService: ConciergeService) {}

  @Post('sessions')
  upsertSession(@Body() dto: CreateSessionDto) {
    return this.conciergeService.upsertSession(dto);
  }

  @Post('sessions/:sessionId/messages')
  createMessage(
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.conciergeService.createMessage(sessionId, dto);
  }

  @Post('messages/:messageId/tool-calls')
  createToolCall(
    @Param('messageId', new ParseUUIDPipe()) messageId: string,
    @Body() dto: CreateToolCallDto,
  ) {
    return this.conciergeService.createToolCall(messageId, dto);
  }

  @Post('messages/:messageId/match-suggestions')
  createMatchSuggestion(
    @Param('messageId', new ParseUUIDPipe()) messageId: string,
    @Body() dto: CreateMatchSuggestionDto,
  ) {
    return this.conciergeService.createMatchSuggestion(messageId, dto);
  }

  @Post('messages/:messageId/feedback')
  createFeedback(
    @Param('messageId', new ParseUUIDPipe()) messageId: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.conciergeService.createFeedback(messageId, dto);
  }
}
