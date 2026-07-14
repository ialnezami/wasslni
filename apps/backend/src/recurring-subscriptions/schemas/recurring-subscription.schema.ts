import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { RecurringSubscriptionStatus } from '@wasslni/shared-types';
import { BaseDocument } from '../../database/base.schema';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'recurring_subscriptions' })
export class RecurringSubscription extends BaseDocument {
  @Prop({ type: Types.ObjectId, ref: 'RecurringTrip', required: true, index: true })
  recurringTripId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  passengerId!: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  seats!: number;

  @Prop({ required: true, enum: RecurringSubscriptionStatus, default: RecurringSubscriptionStatus.Pending })
  status!: RecurringSubscriptionStatus;

  @Prop({ type: [Number], default: null })
  scheduleDays!: number[] | null;

  @Prop({ type: [String], default: [] })
  skippedDates!: string[];
}

export const RecurringSubscriptionSchema = SchemaFactory.createForClass(RecurringSubscription);
