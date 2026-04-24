import { IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsUUID()
  eventId!: string;

  @IsUUID()
  eventAttendeeId!: string;
}
