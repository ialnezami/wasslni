import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/base.schema';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'vehicles' })
export class Vehicle extends BaseDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  driverId!: Types.ObjectId;

  @Prop({ required: true })
  brand!: string;

  @Prop({ required: true })
  vehicleModel!: string;

  @Prop({ required: true })
  year!: number;

  @Prop({ required: true })
  color!: string;

  @Prop({ required: true, unique: true })
  licensePlate!: string;

  @Prop({ required: true, min: 1 })
  seats!: number;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
