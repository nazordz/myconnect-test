import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { OpenAiService } from '@/openai/openai.service';
import { CreateAttendeeDto } from './dto/create-attendee.dto';
import { ListAttendeesDto } from './dto/list-attendees.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openAiService: OpenAiService,
  ) {}

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

  async updateEvent(eventId: string, dto: UpdateEventDto) {
    const event = await this.getEventOrThrow(eventId);
    const startAt = dto.startAt ? new Date(dto.startAt) : event.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : event.endAt;

    if (endAt <= startAt) {
      throw new BadRequestException('endAt must be later than startAt');
    }

    const data: Prisma.EventUpdateInput = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.location !== undefined ? { location: dto.location } : {}),
      ...(dto.startAt !== undefined ? { startAt } : {}),
      ...(dto.endAt !== undefined ? { endAt } : {}),
    };

    return this.prisma.event.update({
      where: { id: eventId },
      data,
    });
  }

  async removeEvent(eventId: string) {
    await this.assertEventExists(eventId);

    return this.prisma.event.delete({
      where: { id: eventId },
    });
  }

  async createAttendee(eventId: string, dto: CreateAttendeeDto) {
    await this.assertEventExists(eventId);

    const profileText = [
      `name: ${dto.name}`,
      `headline: ${dto.headline}`,
      `bio: ${dto.bio}`,
      dto.company ? `Company: ${dto.company}` : null,
      dto.role ? `Role: ${dto.role}` : null,
      dto.skills?.length ? `Skills: ${dto.skills.join(', ')}` : null,
      dto.lookingFor ? `Looking for: ${dto.lookingFor}` : null,
      `Open to chat: ${dto.openToChat ? 'yes' : 'no'}`,
    ]
      .filter(Boolean)
      .join('\n');

    const embeddingProfile = await this.openAiService.embedText(profileText);

    const vectorLiteral = `[${embeddingProfile.join(',')}]`;
    const newAttendee = await this.prisma.$transaction(async (tx) => {
      const created = await tx.attendee.create({
        data: {
          eventId,
          name: dto.name,
          headline: dto.headline,
          bio: dto.bio,
          company: dto.company,
          role: dto.role,
          skills: dto.skills,
          lookingFor: dto.lookingFor,
          openToChat: dto.openToChat ?? true,
          profileText: profileText,
        },
      });
      await tx.$executeRawUnsafe(
        `
      UPDATE attendees
      SET embedding = $1::vector,
          embedding_model = $2,
          embedding_updated_at = $3
      WHERE id = $4::uuid
      `,
        vectorLiteral,
        'text-embedding-3-small',
        new Date(),
        created.id,
      );
      return created;
    });

    return this.prisma.attendee.findUniqueOrThrow({
      where: { id: newAttendee.id },
    });
  }

  async listAttendees(eventId: string, query: ListAttendeesDto) {
    await this.assertEventExists(eventId);

    const where: Prisma.AttendeeWhereInput = {
      eventId,
      ...(query.skills
        ? { skills: { hasSome: query.skills.split(',').map((s) => s.trim()) } }
        : {}),
      ...(query.openToChat !== undefined
        ? { openToChat: query.openToChat }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { company: { contains: query.search, mode: 'insensitive' } },
              { role: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.attendee.count({ where }),
      this.prisma.attendee.findMany({
        where,
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
    await this.getEventOrThrow(eventId);
  }

  private async getEventOrThrow(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }
    return event;
  }
}
