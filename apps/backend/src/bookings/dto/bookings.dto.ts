import { Type } from 'class-transformer';
import { IsInt, IsMongoId, Min } from 'class-validator';
export class CreateBookingDto { @IsMongoId() rideId!: string; @Type(() => Number) @IsInt() @Min(1) seats!: number; }
