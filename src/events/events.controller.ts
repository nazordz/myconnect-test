import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateEventAttendeeDto } from './dto/create-event-attendee.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventAttendeesDto } from './dto/list-event-attendees.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  createEvent(@Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(dto);
  }

  @Post(':eventId/attendees')
  createAttendee(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() dto: CreateEventAttendeeDto,
  ) {
    return this.eventsService.createAttendee(eventId, dto);
  }

  @Get(':eventId/attendees')
  listAttendees(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Query() query: ListEventAttendeesDto,
  ) {
    return this.eventsService.listAttendees(eventId, query);
  }
}
