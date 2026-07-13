import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ReportReason, ReportTargetType } from '@wasslni/shared-types';
import { BaseDocument } from '../../database/base.schema';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'reports' })
export class Report extends BaseDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId!: Types.ObjectId;

  @Prop({ required: true, enum: ReportTargetType })
  targetType!: ReportTargetType;

  @Prop({ required: true })
  targetId!: string;

  @Prop({ required: true, enum: ReportReason })
  reason!: ReportReason;

  @Prop()
  description?: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
