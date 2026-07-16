import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, IsString, MaxLength, Min } from 'class-validator';
export class CreateBookingDto { @IsMongoId() rideId!: string; @Type(() => Number) @IsInt() @Min(1) seats!: number; }
export class CancelByDriverDto { @IsOptional() @IsString() @MaxLength(500) reason?: string; }
