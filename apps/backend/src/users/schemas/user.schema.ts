import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserRole } from '@wasslni/shared-types';
import { BaseDocument } from '../../database/base.schema';

@Schema({ timestamps: true, collection: 'users' })
export class User extends BaseDocument {
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ select: false })
  refreshTokenHash?: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.Passenger })
  role!: UserRole;

  @Prop()
  photoUrl?: string;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: false })
  isBanned!: boolean;

  @Prop({ default: 0 })
  averageRating!: number;

  @Prop({ enum: ['male', 'female', 'other'] })
  gender?: string;

  @Prop()
  dateOfBirth?: string;

  @Prop({ default: 'ar' })
  preferredLanguage!: string;

  @Prop({ maxlength: 500 })
  bio?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
