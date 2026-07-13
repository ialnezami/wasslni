import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsOptional, IsString, MaxLength } from 'class-validator';
export class CreateCityDto { @IsString() @MaxLength(100) nameAr!: string; @IsString() @MaxLength(100) nameFr!: string; @IsOptional() @IsString() @MaxLength(100) nameEn?: string; @Type(() => Number) @IsLatitude() lat!: number; @Type(() => Number) @IsLongitude() lng!: number; }
export class UpdateCityDto { @IsOptional() @IsString() @MaxLength(100) nameAr?: string; @IsOptional() @IsString() @MaxLength(100) nameFr?: string; @IsOptional() @IsString() @MaxLength(100) nameEn?: string; @IsOptional() @Type(() => Number) @IsLatitude() lat?: number; @IsOptional() @Type(() => Number) @IsLongitude() lng?: number; }
