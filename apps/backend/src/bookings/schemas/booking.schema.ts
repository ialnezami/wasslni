import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BookingStatus, PaymentStatus } from '@wasslni/shared-types';
import { BaseDocument } from '../../database/base.schema';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'bookings' })
export class Booking extends BaseDocument {
  @Prop({ type: Types.ObjectId, ref: 'Ride', required: true, index: true })
  rideId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  passengerId!: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  seats!: number;

  @Prop({ required: true, enum: BookingStatus, default: BookingStatus.Pending })
  status!: BookingStatus;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.Pending })
  paymentStatus!: PaymentStatus;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
