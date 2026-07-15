import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsMongoId()
  bookingId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text!: string;
}
