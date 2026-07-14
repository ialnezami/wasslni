import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { RecurringTripStatus } from '@wasslni/shared-types';
import { BaseDocument } from '../../database/base.schema';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'recurring_trips' })
export class RecurringTrip extends BaseDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  driverId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true })
  vehicleId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'City', required: true, index: true })
  departureCityId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'City', required: true, index: true })
  destinationCityId!: Types.ObjectId;

  @Prop({ required: true })
  departurePoint!: string;

  @Prop()
  destinationPoint?: string;

  @Prop({ required: true })
  departureTime!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  totalSeats!: number;

  @Prop()
  description?: string;

  @Prop({ type: Object, required: true })
  recurrence!: { type: 'daily' | 'weekdays'; days: number[] };

  @Prop({ required: true, enum: RecurringTripStatus, default: RecurringTripStatus.Active, index: true })
  status!: RecurringTripStatus;

  @Prop({ required: true, type: Date })
  generatedUpTo!: Date;

  @Prop({ type: Date, default: null })
  cascadeProcessedAt?: Date | null;
}

export const RecurringTripSchema = SchemaFactory.createForClass(RecurringTrip);
