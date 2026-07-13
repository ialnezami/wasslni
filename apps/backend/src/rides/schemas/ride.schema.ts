import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { RideStatus } from '@wasslni/shared-types';
import { BaseDocument } from '../../database/base.schema';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'rides' })
export class Ride extends BaseDocument {
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

  @Prop({ required: true, index: true })
  date!: string;

  @Prop({ required: true })
  departureTime!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  totalSeats!: number;

  @Prop({ required: true })
  availableSeats!: number;

  @Prop()
  description?: string;

  @Prop({ required: true, enum: RideStatus, default: RideStatus.Scheduled, index: true })
  status!: RideStatus;
}

export const RideSchema = SchemaFactory.createForClass(Ride);
RideSchema.index({ departureCityId: 1, destinationCityId: 1, date: 1 });
