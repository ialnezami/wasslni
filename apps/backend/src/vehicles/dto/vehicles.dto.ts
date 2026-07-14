import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
export class CreateVehicleDto {
  @IsString() @MaxLength(60) brand!: string;
  @IsString() @MaxLength(60) vehicleModel!: string;
  @Type(() => Number) @IsInt() @Min(1900) year!: number;
  @IsString() @MaxLength(40) color!: string;
  @IsString() @MaxLength(30) licensePlate!: string;
  @Type(() => Number) @IsInt() @Min(1) seats!: number;
}
export class UpdateVehicleDto {
  @IsOptional() @IsString() @MaxLength(60) brand?: string;
  @IsOptional() @IsString() @MaxLength(60) vehicleModel?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) year?: number;
  @IsOptional() @IsString() @MaxLength(40) color?: string;
  @IsOptional() @IsString() @MaxLength(30) licensePlate?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) seats?: number;
  @IsOptional() @IsString() @MaxLength(500) photoUrl?: string;
}
