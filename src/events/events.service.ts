import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttendeeDto } from './dto/create-attendee.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { ListAttendeesDto } from './dto/list-attendees.dto';

export interface EventEntity {
  id: string;
  name: string;
  createdAt: string;
}

export interface EventAttendeeEntity {
  id: string;
  eventId: string;
  name: string;
  role: string;
  skills: string[];
  lookingFor?: string;
  openToChat: boolean;
}

@Injectable()
export class EventsService {
  private readonly events = new Map<string, EventEntity>();
  private readonly attendees = new Map<string, EventAttendeeEntity[]>();

  createEvent(dto: CreateEventDto): EventEntity {
    const event: EventEntity = {
      id: this.generateId(),
      name: dto.name,
      createdAt: new Date().toISOString(),
    };

    this.events.set(event.id, event);
    this.attendees.set(event.id, []);
    return event;
  }

  addAttendee(eventId: string, dto: CreateAttendeeDto): EventAttendeeEntity {
    this.ensureEventExists(eventId);

    const eventAttendee: EventAttendeeEntity = {
      id: this.generateId(),
      eventId,
      name: dto.name,
      role: dto.role,
      skills: dto.skills,
      lookingFor: dto.lookingFor,
      openToChat: dto.openToChat ?? true,
    };

    this.attendees.get(eventId)?.push(eventAttendee);
    return eventAttendee;
  }

  listAttendees(eventId: string, query: ListAttendeesDto) {
    this.ensureEventExists(eventId);

    const allAttendees = [...(this.attendees.get(eventId) ?? [])];
    const skillFilters = query.skills
      ? query.skills
          .split(',')
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const filtered = allAttendees.filter((attendee) => {
      const roleMatch = query.role
        ? attendee.role.toLowerCase() === query.role.toLowerCase()
        : true;

      const skillsMatch =
        skillFilters.length > 0
          ? skillFilters.every((skill) =>
              attendee.skills.some(
                (attendeeSkill) => attendeeSkill.toLowerCase() === skill,
              ),
            )
          : true;

      return roleMatch && skillsMatch;
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return {
      data,
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit) || 1,
      },
    };
  }

  getAttendee(eventId: string, attendeeId: string): EventAttendeeEntity {
    this.ensureEventExists(eventId);
    const attendee = (this.attendees.get(eventId) ?? []).find(
      (item) => item.id === attendeeId,
    );

    if (!attendee) {
      throw new NotFoundException(
        `Attendee ${attendeeId} not found for event ${eventId}`,
      );
    }

    return attendee;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private ensureEventExists(eventId: string): void {
    if (!this.events.has(eventId)) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }
  }
}
