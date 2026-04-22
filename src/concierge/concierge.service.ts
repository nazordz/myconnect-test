import { Injectable, NotFoundException } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { OpenAiService } from '../openai/openai.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreateConciergeMessageDto } from './dto/create-concierge-message.dto';

export interface ConciergeMessage {
  id: string;
  eventId: string;
  attendeeId: string;
  userMessage: string;
  assistantMessage: string;
  matches: Array<{
    attendeeId: string;
    score: number;
    rationale: string;
    shared_ground: string[];
    draft_intro_message: string;
  }>;
  createdAt: string;
}

export interface MessageFeedback {
  id: string;
  messageId: string;
  eventId: string;
  rating: number;
  notes?: string;
  createdAt: string;
}

@Injectable()
export class ConciergeService {
  private readonly messages = new Map<string, ConciergeMessage[]>();
  private readonly feedback = new Map<string, MessageFeedback[]>();

  constructor(
    private readonly eventsService: EventsService,
    private readonly openAiService: OpenAiService,
  ) {}

  sendMessage(eventId: string, dto: CreateConciergeMessageDto) {
    const requester = this.eventsService.getAttendee(eventId, dto.attendee_id);
    const candidates = this.eventsService
      .listAttendees(eventId, { page: 1, limit: 100 })
      .data.filter((item) => item.id !== requester.id && item.openToChat)
      .map((candidate, index) => ({
        attendeeId: candidate.id,
        score: Math.max(30, 100 - index * 10),
        rationale: `${candidate.name} cocok karena role ${candidate.role} dan skill overlap.`,
        shared_ground: candidate.skills.slice(0, 3),
        draft_intro_message: `Hi ${candidate.name}, saya ${requester.name}. Tertarik ngobrol soal ${candidate.skills[0] ?? 'networking'}?`,
      }))
      .slice(0, 3);

    const assistantMessage =
      candidates.length > 0
        ? `Saya menemukan ${candidates.length} kandidat terbaik untuk kamu. Saya juga sudah siapkan draft intro message.`
        : 'Saat ini belum ada kandidat yang cocok. Coba update intent atau skill yang dicari.';

    const message: ConciergeMessage = {
      id: this.generateId(),
      eventId,
      attendeeId: requester.id,
      userMessage: dto.message,
      assistantMessage,
      matches: candidates,
      createdAt: new Date().toISOString(),
    };

    const bucket = this.messages.get(eventId) ?? [];
    bucket.push(message);
    this.messages.set(eventId, bucket);

    return {
      id: message.id,
      assistant_response: message.assistantMessage,
      matches: message.matches,
      provider: this.openAiService.getClient().constructor.name,
    };
  }

  createFeedback(eventId: string, messageId: string, dto: CreateFeedbackDto) {
    const message = (this.messages.get(eventId) ?? []).find(
      (item) => item.id === messageId,
    );

    if (!message) {
      throw new NotFoundException(
        `Message ${messageId} not found for event ${eventId}`,
      );
    }

    const feedback: MessageFeedback = {
      id: this.generateId(),
      messageId,
      eventId,
      rating: dto.rating,
      notes: dto.notes,
      createdAt: new Date().toISOString(),
    };

    const bucket = this.feedback.get(eventId) ?? [];
    bucket.push(feedback);
    this.feedback.set(eventId, bucket);

    return feedback;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
