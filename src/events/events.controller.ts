import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';
import { ListAttendeesDto } from './dto/list-attendees.dto';
import { CreateAttendeeDto } from './dto/create-attendee.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  createEvent(@Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(dto);
  }

  @Patch(':eventId')
  updateEvent(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(eventId, dto);
  }

  @Delete(':eventId')
  removeEvent(@Param('eventId', new ParseUUIDPipe()) eventId: string) {
    return this.eventsService.removeEvent(eventId);
  }

  @Post(':eventId/attendees')
  createAttendee(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body() dto: CreateAttendeeDto,
  ) {
    return this.eventsService.createAttendee(eventId, dto);
  }

  @Get(':eventId/attendees')
  listAttendees(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Query() query: ListAttendeesDto,
  ) {
    return this.eventsService.listAttendees(eventId, query);
  }
}
