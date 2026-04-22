import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateAttendeeDto } from './dto/create-attendee.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { ListAttendeesDto } from './dto/list-attendees.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  createEvent(@Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(dto);
  }

  @Post(':id/attendees')
  addAttendee(@Param('id') eventId: string, @Body() dto: CreateAttendeeDto) {
    return this.eventsService.addAttendee(eventId, dto);
  }

  @Get(':id/attendees')
  listAttendees(
    @Param('id') eventId: string,
    @Query() query: ListAttendeesDto,
  ) {
    return this.eventsService.listAttendees(eventId, query);
  }
}
