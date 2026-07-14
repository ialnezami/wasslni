import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateSubscriptionDto {
  @Type(() => Number) @IsInt() @Min(1) seats!: number;
  @IsOptional() @IsArray() @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true }) scheduleDays?: number[] | null;
}

export class SkipDateDto {
  @IsDateString() date!: string;
}
