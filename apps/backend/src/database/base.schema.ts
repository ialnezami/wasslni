import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class BaseDocument extends Document {
  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export type BaseDocumentType = BaseDocument & {
  createdAt: Date;
  updatedAt: Date;
};
