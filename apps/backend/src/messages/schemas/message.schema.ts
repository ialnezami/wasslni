import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/base.schema';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'messages' })
export class Message extends BaseDocument {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId!: Types.ObjectId;

  @Prop({ required: true, maxlength: 1000 })
  text!: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ bookingId: 1, createdAt: 1 });
