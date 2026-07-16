import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsMongoId, IsOptional, IsPositive, IsString, Matches, MaxLength, Min } from 'class-validator';
import { RideStatus } from '@wasslni/shared-types';

export class CreateRideDto {
  @IsMongoId() vehicleId!: string;
  @IsMongoId() departureCityId!: string;
  @IsMongoId() destinationCityId!: string;
  @IsString() @MaxLength(200) departurePoint!: string;
  @IsOptional() @IsString() @MaxLength(200) destinationPoint?: string;
  @IsDateString() date!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) departureTime!: string;
  @Type(() => Number) @IsPositive() price!: number;
  @Type(() => Number) @IsInt() @Min(1) totalSeats!: number;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}

export class UpdateRideDto {
  @IsOptional() @IsMongoId() vehicleId?: string;
  @IsOptional() @IsMongoId() departureCityId?: string;
  @IsOptional() @IsMongoId() destinationCityId?: string;
  @IsOptional() @IsString() @MaxLength(200) departurePoint?: string;
  @IsOptional() @IsString() @MaxLength(200) destinationPoint?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) departureTime?: string;
  @IsOptional() @Type(() => Number) @IsPositive() price?: number;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}

export class CancelRideDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class SearchRidesDto {
  @IsOptional() @IsMongoId() departureCityId?: string;
  @IsOptional() @IsMongoId() destinationCityId?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @Type(() => Number) @IsPositive() minPrice?: number;
  @IsOptional() @Type(() => Number) @IsPositive() maxPrice?: number;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) earliestTime?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) latestTime?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) seats?: number;
  @IsOptional() @IsEnum(['cheapest', 'earliest', 'latest'] as const) sort?: 'cheapest' | 'earliest' | 'latest';
}
