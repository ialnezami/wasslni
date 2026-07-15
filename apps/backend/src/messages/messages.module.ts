// apps/backend/src/messages/messages.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Message, MessageSchema } from './schemas/message.schema';
import { MessagesRepository } from './repositories/messages.repository';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ChatGateway } from './chat.gateway';
import { BookingsModule } from '../bookings/bookings.module';
import { RidesModule } from '../rides/rides.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
      }),
    }),
    BookingsModule,
    RidesModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesRepository, ChatGateway],
})
export class MessagesModule {}
