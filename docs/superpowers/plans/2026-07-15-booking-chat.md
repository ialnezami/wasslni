# Booking Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-booking real-time chat between driver and passenger via Socket.io, with a slide-over drawer UI on both the driver's booking requests page and the passenger's bookings page.

**Architecture:** New `messages` NestJS module with MongoDB persistence and a Socket.io `ChatGateway` on the `/chat` namespace. Frontend uses a singleton `socket.io-client` connection, a `useChat` hook per active drawer, and a shared `ChatDrawer` slide-over component wired into both booking pages.

**Tech Stack:** NestJS · Socket.io (`@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`) · MongoDB/Mongoose · React · `socket.io-client` · TailwindCSS · i18next

## Global Constraints

- All new backend code follows the existing `BaseDocument` soft-delete pattern (`deletedAt: null` filter on all queries)
- All new backend endpoints are JWT-guarded via existing `JwtAuthGuard`
- Gateway validates participation on every event (no trust from prior join)
- Message text: min 1 char, max 1000 chars, trimmed server-side
- RTL layout: use `end-0` / `justify-end` / `justify-start` (logical CSS), never `right-0` / `mr-` / `ml-`
- i18n: add keys to all 3 locale files (`ar.json`, `en.json`, `fr.json`) together
- Follow existing file/folder patterns exactly (see notifications module as reference)

---

## File Map

### New — Backend
| File | Responsibility |
|------|---------------|
| `apps/backend/src/messages/schemas/message.schema.ts` | Mongoose schema + compound index |
| `apps/backend/src/messages/repositories/messages.repository.ts` | DB queries |
| `apps/backend/src/messages/dto/message.dto.ts` | `SendMessageDto` for gateway validation |
| `apps/backend/src/messages/messages.service.ts` | Participation check + history + create |
| `apps/backend/src/messages/messages.controller.ts` | `GET /messages/:bookingId` |
| `apps/backend/src/messages/chat.gateway.ts` | Socket.io gateway (`/chat` namespace) |
| `apps/backend/src/messages/messages.module.ts` | Wires all of the above |

### Modified — Backend
| File | Change |
|------|--------|
| `apps/backend/src/app.module.ts` | Import `MessagesModule` |
| `apps/backend/src/main.ts` | Register `IoAdapter` |

### Modified — Shared Types
| File | Change |
|------|--------|
| `packages/shared-types/src/models.ts` | Add `Message` interface |

### New — Frontend
| File | Responsibility |
|------|---------------|
| `apps/frontend/src/lib/socket.ts` | Singleton `socket.io-client` for `/chat` namespace |
| `apps/frontend/src/api/messages.ts` | REST history fetch |
| `apps/frontend/src/hooks/useChat.ts` | Combines REST history + socket events |
| `apps/frontend/src/components/ChatDrawer.tsx` | Slide-over panel UI |

### Modified — Frontend
| File | Change |
|------|--------|
| `apps/frontend/src/pages/driver/DriverBookingsPage.tsx` | Add chat button + `ChatDrawer` |
| `apps/frontend/src/pages/passenger/BookingsPage.tsx` | Add chat button + `ChatDrawer` |
| `apps/frontend/src/i18n/locales/ar.json` | Add `chat` namespace keys |
| `apps/frontend/src/i18n/locales/en.json` | Add `chat` namespace keys |
| `apps/frontend/src/i18n/locales/fr.json` | Add `chat` namespace keys |

---

## Task 1: Install packages

**Files:** no code files — package installs only

- [ ] **Step 1: Install backend Socket.io packages**

```bash
cd apps/backend && npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

Expected: packages added to `apps/backend/package.json` under `dependencies`.

- [ ] **Step 2: Install frontend socket.io-client**

```bash
cd apps/frontend && npm install socket.io-client
```

Expected: `socket.io-client` added to `apps/frontend/package.json`.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/package.json apps/backend/package-lock.json apps/frontend/package.json apps/frontend/package-lock.json
git commit -m "chore(deps): install socket.io for backend and socket.io-client for frontend"
```

---

## Task 2: Message schema, repository, and DTO

**Files:**
- Create: `apps/backend/src/messages/schemas/message.schema.ts`
- Create: `apps/backend/src/messages/repositories/messages.repository.ts`
- Create: `apps/backend/src/messages/dto/message.dto.ts`

**Interfaces:**
- Produces: `Message` Mongoose class, `MessageSchema`, `MessagesRepository` with `findByBooking(bookingId: string)` and `create(data: {bookingId:string; senderId:string; text:string})`, `SendMessageDto` with `bookingId: string` and `text: string`

- [ ] **Step 1: Create the Message schema**

```typescript
// apps/backend/src/messages/schemas/message.schema.ts
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
```

- [ ] **Step 2: Create the repository**

```typescript
// apps/backend/src/messages/repositories/messages.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '../schemas/message.schema';

@Injectable()
export class MessagesRepository {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {}

  findByBooking(bookingId: string) {
    return this.messageModel
      .find({ bookingId, deletedAt: null })
      .sort({ createdAt: 1 })
      .exec();
  }

  create(data: { bookingId: string; senderId: string; text: string }) {
    return this.messageModel.create(data);
  }
}
```

- [ ] **Step 3: Create the DTO**

```typescript
// apps/backend/src/messages/dto/message.dto.ts
import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsMongoId()
  bookingId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text!: string;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no output (zero errors).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/messages/
git commit -m "feat(messages): add Message schema, repository, and DTO"
```

---

## Task 3: MessagesService

**Files:**
- Create: `apps/backend/src/messages/messages.service.ts`

**Interfaces:**
- Consumes: `MessagesRepository.findByBooking`, `MessagesRepository.create`, `BookingsRepository.findById` (already exported from BookingsModule), `RidesRepository.findById` (already exported from RidesModule)
- Produces: `MessagesService` with `getHistory(bookingId, requesterId)`, `createMessage(bookingId, senderId, text)`, `assertParticipant(bookingId, userId)` (public — used by gateway)

- [ ] **Step 1: Create MessagesService**

```typescript
// apps/backend/src/messages/messages.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessagesRepository } from './repositories/messages.repository';
import { BookingsRepository } from '../bookings/repositories/bookings.repository';
import { RidesRepository } from '../rides/repositories/rides.repository';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly ridesRepository: RidesRepository,
  ) {}

  async getHistory(bookingId: string, requesterId: string) {
    await this.assertParticipant(bookingId, requesterId);
    return this.messagesRepository.findByBooking(bookingId);
  }

  async createMessage(bookingId: string, senderId: string, text: string) {
    await this.assertParticipant(bookingId, senderId);
    return this.messagesRepository.create({ bookingId, senderId, text: text.trim() });
  }

  async assertParticipant(bookingId: string, userId: string): Promise<void> {
    const booking = await this.bookingsRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (String(booking.passengerId) === userId) return;
    const ride = await this.ridesRepository.findById(String(booking.rideId));
    if (!ride || String(ride.driverId) !== userId) {
      throw new ForbiddenException('You are not a participant of this booking');
    }
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/messages/messages.service.ts
git commit -m "feat(messages): add MessagesService with participation guard"
```

---

## Task 4: MessagesController

**Files:**
- Create: `apps/backend/src/messages/messages.controller.ts`

**Interfaces:**
- Consumes: `MessagesService.getHistory(bookingId, requesterId)`, `JwtAuthGuard`, `CurrentUser` decorator, `AuthUser` type
- Produces: `GET /messages/:bookingId` — returns `Message[]`

- [ ] **Step 1: Create the controller**

```typescript
// apps/backend/src/messages/messages.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@wasslni/shared-types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':bookingId')
  getHistory(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagesService.getHistory(bookingId, user.userId);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/messages/messages.controller.ts
git commit -m "feat(messages): add GET /messages/:bookingId REST endpoint"
```

---

## Task 5: ChatGateway

**Files:**
- Create: `apps/backend/src/messages/chat.gateway.ts`

**Interfaces:**
- Consumes: `MessagesService.assertParticipant`, `MessagesService.createMessage`, `JwtService.verifyAsync`, `ConfigService.get('jwt.secret')`
- Produces: Socket.io gateway on namespace `/chat` handling `join-booking`, `send-message`, `leave-booking`; emits `new-message` and `error`

- [ ] **Step 1: Create the gateway**

```typescript
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
        secret: this.configService.get<string>('jwt.secret'),
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/messages/chat.gateway.ts
git commit -m "feat(messages): add ChatGateway with JWT auth and room-based messaging"
```

---

## Task 6: MessagesModule + wire AppModule + IoAdapter

**Files:**
- Create: `apps/backend/src/messages/messages.module.ts`
- Modify: `apps/backend/src/app.module.ts`
- Modify: `apps/backend/src/main.ts`

**Interfaces:**
- Consumes: all files from Tasks 2–5, `BookingsModule` (exports `BookingsRepository`), `RidesModule` (exports `RidesRepository`), `JwtModule`

- [ ] **Step 1: Create MessagesModule**

```typescript
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
```

- [ ] **Step 2: Add MessagesModule to AppModule**

In `apps/backend/src/app.module.ts`, add the import at the top:
```typescript
import { MessagesModule } from './messages/messages.module';
```

And add `MessagesModule` to the `imports` array (after `SchedulerModule`):
```typescript
    SchedulerModule,
    MessagesModule,
```

- [ ] **Step 3: Register IoAdapter in main.ts**

In `apps/backend/src/main.ts`, add the import after existing imports:
```typescript
import { IoAdapter } from '@nestjs/platform-socket.io';
```

Add one line after `const app = await NestFactory.create(AppModule);`:
```typescript
  app.useWebSocketAdapter(new IoAdapter(app));
```

The full updated `bootstrap` start becomes:
```typescript
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  const configService = app.get(ConfigService);
  // ... rest unchanged
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no output.

- [ ] **Step 5: Verify backend starts**

```bash
cd apps/backend && npm run start:dev 2>&1 | head -30
```

Expected: NestJS bootstraps, logs show `[NestApplication] Nest application successfully started` and no unhandled exception. `[WebSocketGateway]` log line also appears.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/messages/messages.module.ts apps/backend/src/app.module.ts apps/backend/src/main.ts
git commit -m "feat(messages): wire MessagesModule into AppModule and register IoAdapter"
```

---

## Task 7: Shared types — Message interface

**Files:**
- Modify: `packages/shared-types/src/models.ts`

**Interfaces:**
- Produces: `Message` interface (exported from `@wasslni/shared-types`)

- [ ] **Step 1: Add Message interface**

In `packages/shared-types/src/models.ts`, add after the `Booking` block:

```typescript
export interface Message extends BaseEntity {
  bookingId: string;
  senderId: string;
  text: string;
}
```

- [ ] **Step 2: Verify shared-types compiles**

```bash
cd packages/shared-types && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add packages/shared-types/src/models.ts
git commit -m "feat(shared-types): add Message interface"
```

---

## Task 8: Frontend — socket singleton and messages API

**Files:**
- Create: `apps/frontend/src/lib/socket.ts`
- Create: `apps/frontend/src/api/messages.ts`

**Interfaces:**
- Produces: `getChatSocket(): Socket` (singleton, reconnects on call if disconnected), `updateSocketAuth(token: string)` (call after token refresh), `messagesApi.getHistory(bookingId: string)`

- [ ] **Step 1: Create the socket singleton**

```typescript
// apps/frontend/src/lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

let socket: Socket | null = null;

function buildSocketUrl(): string {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  return base ? base.replace('/api/v1', '') : '';
}

export function getChatSocket(): Socket {
  if (!socket || socket.disconnected) {
    const token = useAuthStore.getState().accessToken;
    socket = io(`${buildSocketUrl()}/chat`, {
      auth: { token: token ?? '' },
      autoConnect: true,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function updateSocketAuth(token: string) {
  if (socket) {
    socket.auth = { token };
    socket.disconnect().connect();
  }
}
```

- [ ] **Step 2: Create the messages API module**

```typescript
// apps/frontend/src/api/messages.ts
import apiClient from './client';
import type { Message } from '@wasslni/shared-types';

export const messagesApi = {
  getHistory: (bookingId: string) =>
    apiClient.get<Message[]>(`/messages/${bookingId}`),
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/lib/socket.ts apps/frontend/src/api/messages.ts
git commit -m "feat(chat): add socket.io-client singleton and messages REST API module"
```

---

## Task 9: Frontend — useChat hook

**Files:**
- Create: `apps/frontend/src/hooks/useChat.ts`

**Interfaces:**
- Consumes: `getChatSocket()` from `@/lib/socket`, `messagesApi.getHistory` from `@/api/messages`, `Message` from `@wasslni/shared-types`
- Produces: `useChat(bookingId: string | null): { messages: Message[]; isLoading: boolean; send(text: string): void }`

- [ ] **Step 1: Create the hook**

```typescript
// apps/frontend/src/hooks/useChat.ts
import { useEffect, useRef, useState } from 'react';
import type { Message } from '@wasslni/shared-types';
import { getChatSocket } from '@/lib/socket';
import { messagesApi } from '@/api/messages';

export function useChat(bookingId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const activeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setMessages([]);
      return;
    }

    activeRef.current = bookingId;
    const socket = getChatSocket();

    setIsLoading(true);
    messagesApi
      .getHistory(bookingId)
      .then((r) => {
        if (activeRef.current === bookingId) setMessages(r.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    socket.emit('join-booking', { bookingId });

    const onMessage = (msg: Message) => {
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
      );
    };
    socket.on('new-message', onMessage);

    return () => {
      socket.emit('leave-booking', { bookingId });
      socket.off('new-message', onMessage);
      activeRef.current = null;
    };
  }, [bookingId]);

  const send = (text: string) => {
    if (!bookingId || !text.trim()) return;
    getChatSocket().emit('send-message', { bookingId, text: text.trim() });
  };

  return { messages, isLoading, send };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/hooks/useChat.ts
git commit -m "feat(chat): add useChat hook combining REST history and Socket.io real-time"
```

---

## Task 10: Frontend — ChatDrawer component

**Files:**
- Create: `apps/frontend/src/components/ChatDrawer.tsx`

**Interfaces:**
- Consumes: `useChat(bookingId)`, `useAuthStore` (for `user.userId` to identify own messages), `Spinner` from `@/components/ui`, `Button` from `@wasslni/shared-ui`, `Message` type
- Produces: `<ChatDrawer bookingId={string} otherPartyName={string} onClose={() => void} />`

- [ ] **Step 1: Create ChatDrawer**

```tsx
// apps/frontend/src/components/ChatDrawer.tsx
import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { useChat } from '@/hooks/useChat';
import { Button } from '@wasslni/shared-ui';
import { Spinner } from '@/components/ui';

interface ChatDrawerProps {
  bookingId: string;
  otherPartyName: string;
  onClose: () => void;
}

export function ChatDrawer({ bookingId, otherPartyName, onClose }: ChatDrawerProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { messages, isLoading, send } = useChat(bookingId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    send(trimmed);
    setText('');
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      <div className="fixed inset-y-0 end-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold text-slate-900">{otherPartyName}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}
          {!isLoading && messages.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">
              {t('chat.empty')}
            </p>
          )}
          {messages.map((msg) => {
            const isOwn = msg.senderId === user?.userId;
            return (
              <div
                key={msg._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isOwn
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      isOwn ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString('ar', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 border-t px-4 py-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chat.placeholder')}
            className="flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Button onClick={handleSend} disabled={!text.trim()}>
            {t('chat.send')}
          </Button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/ChatDrawer.tsx
git commit -m "feat(chat): add ChatDrawer slide-over component"
```

---

## Task 11: Wire ChatDrawer into DriverBookingsPage

**Files:**
- Modify: `apps/frontend/src/pages/driver/DriverBookingsPage.tsx`

**Interfaces:**
- Consumes: `ChatDrawer` from `@/components/ChatDrawer`, `useState` from React

- [ ] **Step 1: Add import and state**

At the top of `DriverBookingsPage.tsx`, add to existing imports:
```typescript
import { useState } from 'react';
import { ChatDrawer } from '@/components/ChatDrawer';
```

Inside the `DriverBookingsPage` component body, add after existing state/mutations:
```typescript
const [chatBookingId, setChatBookingId] = useState<string | null>(null);
```

- [ ] **Step 2: Render ChatDrawer when active**

At the very start of the `return (...)`, before everything else, add:
```tsx
      {chatBookingId && (
        <ChatDrawer
          bookingId={chatBookingId}
          otherPartyName={t('chat.passenger')}
          onClose={() => setChatBookingId(null)}
        />
      )}
```

- [ ] **Step 3: Add chat button to pending booking cards**

In the `pending.map(...)` card, inside the `<div className="flex gap-2">` that contains Accept/Reject buttons, add before the Accept button:
```tsx
                  <Button
                    variant="secondary"
                    onClick={() => setChatBookingId(b._id)}
                  >
                    {t('chat.open')}
                  </Button>
```

- [ ] **Step 4: Add chat button to rest booking cards**

In the `rest.map(...)` card, replace the existing card body with:
```tsx
            <Card key={b._id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{t('booking.seats', { count: b.seats })}</p>
                  <Badge variant={statusVariant(b.status)}>{t(`booking.status.${b.status}`)}</Badge>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setChatBookingId(b._id)}
                >
                  {t('chat.open')}
                </Button>
              </div>
            </Card>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/pages/driver/DriverBookingsPage.tsx
git commit -m "feat(chat): wire ChatDrawer into DriverBookingsPage"
```

---

## Task 12: Wire ChatDrawer into BookingsPage + add i18n to all locales

**Files:**
- Modify: `apps/frontend/src/pages/passenger/BookingsPage.tsx`
- Modify: `apps/frontend/src/i18n/locales/ar.json`
- Modify: `apps/frontend/src/i18n/locales/en.json`
- Modify: `apps/frontend/src/i18n/locales/fr.json`

**Interfaces:**
- Consumes: `ChatDrawer` from `@/components/ChatDrawer`

- [ ] **Step 1: Add import and state to BookingsPage**

Add to imports at top of `BookingsPage.tsx`:
```typescript
import { ChatDrawer } from '@/components/ChatDrawer';
```

`useState` is already imported. Add inside the component:
```typescript
const [chatBookingId, setChatBookingId] = useState<string | null>(null);
```

- [ ] **Step 2: Render ChatDrawer**

At the very start of the `return (...)` in `BookingsPage`, before the `{skipModalSubId && ...}` block, add:
```tsx
      {chatBookingId && (
        <ChatDrawer
          bookingId={chatBookingId}
          otherPartyName={t('chat.driver')}
          onClose={() => setChatBookingId(null)}
        />
      )}
```

- [ ] **Step 3: Add chat button to active booking cards**

Inside the `activeBookings.map(...)` card, in the `<div className="flex gap-2">` that contains the "View Details" link and cancel button, add after the Link:
```tsx
                    <Button
                      variant="secondary"
                      onClick={() => setChatBookingId(booking._id)}
                    >
                      {t('chat.open')}
                    </Button>
```

- [ ] **Step 4: Add i18n keys to ar.json**

In `apps/frontend/src/i18n/locales/ar.json`, add a new top-level `"chat"` key (before the closing `}`):
```json
  "chat": {
    "title": "المحادثة",
    "placeholder": "اكتب رسالة...",
    "send": "إرسال",
    "empty": "لا توجد رسائل بعد. ابدأ المحادثة!",
    "open": "محادثة",
    "driver": "السائق",
    "passenger": "الراكب",
    "errorLoad": "تعذر تحميل الرسائل",
    "errorSend": "تعذر إرسال الرسالة"
  }
```

- [ ] **Step 5: Add i18n keys to en.json**

In `apps/frontend/src/i18n/locales/en.json`, add:
```json
  "chat": {
    "title": "Chat",
    "placeholder": "Type a message...",
    "send": "Send",
    "empty": "No messages yet. Start the conversation!",
    "open": "Chat",
    "driver": "Driver",
    "passenger": "Passenger",
    "errorLoad": "Failed to load messages",
    "errorSend": "Failed to send message"
  }
```

- [ ] **Step 6: Add i18n keys to fr.json**

In `apps/frontend/src/i18n/locales/fr.json`, add:
```json
  "chat": {
    "title": "Conversation",
    "placeholder": "Écrire un message...",
    "send": "Envoyer",
    "empty": "Aucun message pour l'instant. Commencez la conversation !",
    "open": "Chat",
    "driver": "Conducteur",
    "passenger": "Passager",
    "errorLoad": "Impossible de charger les messages",
    "errorSend": "Impossible d'envoyer le message"
  }
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd apps/frontend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: no output.

- [ ] **Step 8: Final commit**

```bash
git add apps/frontend/src/pages/passenger/BookingsPage.tsx apps/frontend/src/i18n/locales/ar.json apps/frontend/src/i18n/locales/en.json apps/frontend/src/i18n/locales/fr.json
git commit -m "feat(chat): wire ChatDrawer into BookingsPage and add i18n keys (ar/en/fr)"
```

---

## Manual E2E Verification

After all tasks complete, verify end-to-end:

1. Start backend (`npm run start:dev` in `apps/backend`)
2. Start frontend (`npm run dev` in `apps/frontend`)
3. Log in as a **driver** in one browser tab; log in as a **passenger** in another
4. Passenger books a real ride → booking appears in driver's `/app/booking-requests`
5. Driver clicks "محادثة" on the pending booking → drawer slides in from the right
6. Passenger navigates to `/app/bookings` → clicks "محادثة" on the same booking
7. Driver types a message → it appears instantly in the passenger's drawer
8. Passenger replies → appears instantly in the driver's drawer
9. Close and reopen the drawer → history loads from DB (messages persist)
10. Verify a third user cannot join the booking's chat room (the gateway returns an `error` event)
