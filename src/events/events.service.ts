import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventAttendeeDto } from './dto/create-event-attendee.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventAttendeesDto } from './dto/list-event-attendees.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(dto: CreateEventDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (endAt <= startAt) {
      throw new BadRequestException('endAt must be later than startAt');
    }

    return this.prisma.event.create({
      data: {
        title: dto.title,
        location: dto.location,
        startAt,
        endAt,
      },
    });
  }

  async createAttendee(eventId: string, dto: CreateEventAttendeeDto) {
    await this.assertEventExists(eventId);

    const attendeeId =
      dto.attendeeId ??
      (
        await this.prisma.attendee.create({
          data: {
            name: dto.name ?? 'Unnamed attendee',
            headline: dto.headline,
            bio: dto.bio,
            company: dto.company,
            role: dto.role,
          },
        })
      ).id;

    return this.prisma.eventAttendee.upsert({
      where: {
        eventId_attendeeId: {
          eventId,
          attendeeId,
        },
      },
      create: {
        eventId,
        attendeeId,
        skills: dto.skills,
        lookingFor: dto.lookingFor,
        openToChat: dto.openToChat ?? true,
        profileText: dto.profileText,
      },
      update: {
        skills: dto.skills,
        lookingFor: dto.lookingFor,
        openToChat: dto.openToChat ?? true,
        profileText: dto.profileText,
      },
      include: {
        attendee: true,
      },
    });
  }

  async listAttendees(eventId: string, query: ListEventAttendeesDto) {
    await this.assertEventExists(eventId);

    const where: Prisma.EventAttendeeWhereInput = {
      eventId,
      ...(query.openToChat !== undefined
        ? { openToChat: query.openToChat }
        : {}),
      ...(query.skill ? { skills: { has: query.skill } } : {}),
      ...(query.search
        ? {
            attendee: {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { company: { contains: query.search, mode: 'insensitive' } },
                { role: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.eventAttendee.count({ where }),
      this.prisma.eventAttendee.findMany({
        where,
        include: {
          attendee: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: query.pageSize,
      }),
    ]);

    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items,
    };
  }

  private async assertEventExists(eventId: string): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }
  }
}
