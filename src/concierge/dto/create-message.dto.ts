import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ConciergeMessageRole,
  LlmProvider,
  ToolCallStatus,
} from '../../generated/prisma/client';

export class CreateMessageDto {
  @IsEnum(ConciergeMessageRole)
  role!: ConciergeMessageRole;

  @IsObject()
  content!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  rawText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  requestId?: string;

  @IsOptional()
  @IsEnum(LlmProvider)
  llmProvider?: LlmProvider;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  llmModel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  promptTokens?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  completionTokens?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalTokens?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  latencyMs?: number;
}

export class CreateToolCallDto {
  @IsString()
  @MaxLength(80)
  toolName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  toolCallId?: string;

  @IsEnum(ToolCallStatus)
  status!: ToolCallStatus;

  @IsObject()
  input!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  output?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  latencyMs?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  errorMessage?: string;
}

export class CreateMatchSuggestionDto {
  @IsUUID()
  requesterEventAttendeeId!: string;

  @IsUUID()
  candidateEventAttendeeId!: string;

  @Type(() => Number)
  @IsInt()
  rank!: number;

  @Type(() => Number)
  @IsInt()
  score!: number;

  @IsString()
  @MaxLength(2000)
  rationale!: string;

  @IsObject()
  sharedGround!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  draftIntroMessage?: string;
}

export class CreateFeedbackDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
