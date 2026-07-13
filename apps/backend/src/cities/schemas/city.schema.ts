import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/base.schema';

@Schema({ timestamps: true, collection: 'cities' })
export class City extends BaseDocument {
  @Prop({ required: true })
  nameAr!: string;

  @Prop({ required: true })
  nameFr!: string;

  @Prop()
  nameEn?: string;

  @Prop({ required: true })
  lat!: number;

  @Prop({ required: true })
  lng!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const CitySchema = SchemaFactory.createForClass(City);
