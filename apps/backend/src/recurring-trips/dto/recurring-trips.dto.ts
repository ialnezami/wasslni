import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsMongoId, IsOptional, IsPositive, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { RecurringTripStatus } from '@wasslni/shared-types';

class RecurrenceDto {
  @IsEnum(['daily', 'weekdays']) type!: 'daily' | 'weekdays';
  @IsArray() @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true }) days!: number[];
}

export class CreateRecurringTripDto {
  @IsMongoId() vehicleId!: string;
  @IsMongoId() departureCityId!: string;
  @IsMongoId() destinationCityId!: string;
  @IsString() @MaxLength(200) departurePoint!: string;
  @IsOptional() @IsString() @MaxLength(200) destinationPoint?: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) departureTime!: string;
  @Type(() => Number) @IsPositive() price!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(8) totalSeats!: number;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @ValidateNested() @Type(() => RecurrenceDto) recurrence!: RecurrenceDto;
}

export class UpdateRecurringTripDto {
  @IsOptional() @IsEnum(RecurringTripStatus) status?: RecurringTripStatus;
  @IsOptional() @Type(() => Number) @IsPositive() price?: number;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}
