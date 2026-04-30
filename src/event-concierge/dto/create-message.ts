import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  attendeeId!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}
