import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateEventAttendeeDto {
  @IsOptional()
  @IsUUID()
  attendeeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  role?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  skills!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  lookingFor?: string;

  @IsOptional()
  @IsBoolean()
  openToChat?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  profileText?: string;
}
