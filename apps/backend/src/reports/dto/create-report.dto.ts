import { IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportReason, ReportTargetType } from '@wasslni/shared-types';

export class CreateReportDto {
  @IsEnum(ReportTargetType) targetType!: ReportTargetType;
  @IsMongoId() targetId!: string;
  @IsEnum(ReportReason) reason!: ReportReason;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}
