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
import { validate, IsMongoId } from 'class-validator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/message.dto';

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
      // Auto-join personal room so the user receives notifications even when no booking drawer is open
      await socket.join(`user-${payload.sub}`);
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

      const senderId = socket.data.userId as string;
      const message = await this.messagesService.createMessage(dto.bookingId, senderId, dto.text);

      const messagePayload = {
        _id: String(message._id),
        bookingId: dto.bookingId,
        senderId,
        text: message.text,
        createdAt: (message as unknown as { createdAt: Date }).createdAt,
      };

      // Broadcast to all participants in the booking room (including sender)
      this.server.to(`booking-${dto.bookingId}`).emit('new-message', messagePayload);

      // Notify the recipient via their personal room so they get a badge even when drawer is closed
      const recipientId = await this.messagesService.getOtherParticipant(dto.bookingId, senderId);
      if (recipientId) {
        this.server
          .to(`user-${recipientId}`)
          .emit('new-message-notification', { bookingId: dto.bookingId, message: messagePayload });
      }
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
