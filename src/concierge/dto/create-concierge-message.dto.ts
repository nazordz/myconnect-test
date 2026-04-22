import { IsNotEmpty, IsString } from 'class-validator';

export class CreateConciergeMessageDto {
  @IsString()
  @IsNotEmpty()
  attendee_id!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}
