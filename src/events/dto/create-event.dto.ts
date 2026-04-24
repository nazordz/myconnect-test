import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;
}
