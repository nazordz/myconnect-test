import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListEventAttendeesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    return value === true || value === 'true';
  })
  @IsBoolean()
  openToChat?: boolean;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
