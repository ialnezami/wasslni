// apps/backend/src/messages/chat.gateway.ts
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/message.dto';
import { IsMongoId } from 'class-validator';

class JoinBookingDto {
  @IsMongoId()
  bookingId!: string;
}

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*', credentials: true } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) throw new Error('No token');
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: this.configService.get<string>('app.jwt.accessSecret'),
      });
      socket.data.userId = payload.sub;
    } catch {
      socket.emit('error', { message: 'Unauthorized' });
      socket.disconnect();
    }
  }

  @SubscribeMessage('join-booking')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: unknown,
  ) {
    try {
      const dto = plainToInstance(JoinBookingDto, payload);
      const errors = await validate(dto);
      if (errors.length > 0) {
        socket.emit('error', { message: 'Invalid bookingId' });
        return;
      }
      await this.messagesService.assertParticipant(
        dto.bookingId,
        socket.data.userId as string,
      );
      await socket.join(`booking-${dto.bookingId}`);
    } catch (err: unknown) {
      socket.emit('error', {
        message: err instanceof Error ? err.message : 'Unauthorized',
      });
    }
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: unknown,
  ) {
    try {
      const dto = plainToInstance(SendMessageDto, payload);
      const errors = await validate(dto);
      if (errors.length > 0) {
        socket.emit('error', { message: 'Invalid payload' });
        return;
      }
      if (!socket.rooms.has(`booking-${dto.bookingId}`)) {
        socket.emit('error', { message: 'Join the booking room first' });
        return;
      }
      const message = await this.messagesService.createMessage(
        dto.bookingId,
        socket.data.userId as string,
        dto.text,
      );
      this.server.to(`booking-${dto.bookingId}`).emit('new-message', {
        _id: String(message._id),
        bookingId: dto.bookingId,
        senderId: socket.data.userId as string,
        text: message.text,
        createdAt: (message as unknown as { createdAt: Date }).createdAt,
      });
    } catch (err: unknown) {
      socket.emit('error', {
        message: err instanceof Error ? err.message : 'Failed to send message',
      });
    }
  }

  @SubscribeMessage('leave-booking')
  async handleLeave(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: unknown,
  ) {
    const p = payload as { bookingId?: string } | undefined;
    if (p?.bookingId) {
      await socket.leave(`booking-${p.bookingId}`);
    }
  }
}
