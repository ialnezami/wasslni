import { IsDateString, IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(120) fullName?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(500) photoUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) licensePhotoUrl?: string;
  @IsOptional() @IsIn(['male', 'female', 'other']) gender?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional() @IsIn(['ar', 'fr', 'en']) preferredLanguage?: string;
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
}
