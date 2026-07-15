# Booking Chat — Design Spec
_Date: 2026-07-15_

## Goal

Allow a driver and a passenger to exchange real-time messages within the context of a specific booking. Chat is private (one-to-one per booking), persisted in MongoDB, and delivered via Socket.io WebSocket.

---

## Scope

- Per-booking private thread: driver ↔ one passenger
- Chat button on each booking card in:
  - Driver: `/app/booking-requests` (DriverBookingsPage)
  - Passenger: `/app/bookings` (BookingsPage)
- Slide-over drawer UI (right side panel, RTL-aware)
- Messages persist across sessions (history loads on drawer open)
- Real-time delivery via Socket.io

Out of scope: group chat, read receipts, file/image attachments, push notifications for new messages (can be added later using the existing notifications module).

---

## Data Model

### Message schema (`messages` collection)

| Field       | Type     | Notes                                      |
|-------------|----------|--------------------------------------------|
| `_id`       | ObjectId |                                            |
| `bookingId` | ObjectId | ref: Booking — indexed                     |
| `senderId`  | ObjectId | ref: User                                  |
| `text`      | string   | max 1000 chars, trimmed, non-empty         |
| `createdAt` | Date     | auto (Mongoose timestamps)                 |
| `deletedAt` | Date\|null | soft delete, null by default             |

**Index:** `{ bookingId: 1, createdAt: 1 }` — efficient conversation load in order.

**Authorization invariant:** only `booking.passengerId` and `booking.ride.driverId` may read or write messages for a given `bookingId`. Enforced at both REST and WebSocket layers.

---

## Backend

### New packages
```
@nestjs/websockets
@nestjs/platform-socket.io
socket.io
```

### New module: `messages`

```
apps/backend/src/messages/
  schemas/message.schema.ts
  repositories/messages.repository.ts
  messages.service.ts
  messages.controller.ts
  chat.gateway.ts
  dto/send-message.dto.ts
  messages.module.ts
```

#### MessagesRepository
- `findByBooking(bookingId: string)` — all non-deleted messages for a booking, sorted by `createdAt asc`
- `create(data)` — insert one message

#### MessagesService
- `getHistory(bookingId, requesterId)` — validates requester is participant (via BookingsService), returns messages
- `createMessage(bookingId, senderId, text)` — validates participation, validates text, saves, returns saved message

#### MessagesController
- `GET /messages/:bookingId` — JWT-guarded, returns message history for the authenticated user

#### ChatGateway (Socket.io)
- **Namespace:** `/chat`
- **Auth:** JWT extracted from `socket.handshake.auth.token` on connection; invalid token disconnects immediately
- **CORS:** mirrors existing NestJS CORS config

| Event (client → server) | Payload              | Server action |
|--------------------------|----------------------|---------------|
| `join-booking`           | `{ bookingId }`      | Validates user is participant → joins room `booking-{bookingId}` |
| `send-message`           | `{ bookingId, text }`| Validates participation, saves to DB, emits `new-message` to room |
| `leave-booking`          | `{ bookingId }`      | Leaves room `booking-{bookingId}` |

| Event (server → client) | Payload |
|--------------------------|---------|
| `new-message`            | `{ _id, bookingId, senderId, text, createdAt }` |
| `error`                  | `{ message }` — invalid room, unauthorized, validation failure |

**Participation validation:** load the booking by ID, check `booking.passengerId === userId` OR load the ride and check `ride.driverId === userId`. Reused in both REST and gateway.

### AppModule change
- Register `@nestjs/platform-socket.io` adapter in `main.ts`
- Import `MessagesModule` in `AppModule`
- `MessagesModule` imports `BookingsModule` and `RidesModule` (for participation check)

---

## Shared Types

Add to `packages/shared-types/src/models.ts`:

```typescript
export interface Message extends BaseEntity {
  bookingId: string;
  senderId: string;
  text: string;
}
```

---

## Frontend

### New package
```
socket.io-client
```

### New files

#### `src/lib/socket.ts`
Singleton `socket.io-client` connecting to `/chat` namespace. Reads `accessToken` from the auth store for `auth.token` on handshake. Reconnects automatically. Exported as `chatSocket`.

#### `src/hooks/useChat.ts`
Props: `bookingId: string | null` (null = inactive)

Behaviour when `bookingId` is set:
1. Fetches `GET /messages/:bookingId` → sets initial message list
2. Emits `join-booking { bookingId }` on the socket
3. Listens for `new-message` → appends to list (deduplicates by `_id`)
4. On cleanup (drawer closes / `bookingId` becomes null): emits `leave-booking`, removes listener

Exposes: `{ messages: Message[], isLoading: boolean, send(text: string): void }`

`send(text)`:
- Emits `send-message { bookingId, text }` via socket (optimistic: append immediately, deduplicate on server echo)

#### `src/components/ChatDrawer.tsx`
Props: `{ bookingId: string; otherPartyName: string; onClose(): void }`

Layout (slide-over from right, RTL-aware):
- Fixed overlay (click to close)
- Panel: header with name + ✕, scrollable message list, sticky text input + send button
- Own messages: right-aligned, emerald background
- Other messages: left-aligned, slate background
- Each message shows time (`HH:mm`)
- Input: Enter key or button sends; disabled while text is empty

### Changes to existing pages

#### DriverBookingsPage
- Each booking card: add "محادثة" button
- State: `chatBookingId: string | null` + `chatPassengerName: string | null`
- Renders `<ChatDrawer>` when `chatBookingId` is set

#### BookingsPage (passenger)
- Each active booking card: add "محادثة" button (show for Pending and Accepted)
- Same state pattern as above
- Renders `<ChatDrawer>` when active

---

## Security

| Concern | Mitigation |
|---------|------------|
| Unauthenticated WS connections | JWT verified on handshake; invalid = immediate disconnect |
| User joining another booking's room | `join-booking` checks participation before joining room |
| User sending to a room they didn't join | `send-message` re-validates participation; socket must be in room |
| Message content | Max 1000 chars, trimmed, non-empty validated server-side |
| Ownership of history | `GET /messages/:bookingId` validates participation before returning |

---

## Failure Handling

| Scenario | Behaviour |
|----------|-----------|
| WS disconnects mid-chat | `socket.io-client` auto-reconnects; re-emits `join-booking` on reconnect |
| `send-message` fails (server error) | Server emits `error` event; frontend shows toast |
| History load fails (REST error) | Shows error state in drawer with retry option |
| User not participant | Server emits `error`; frontend closes drawer |

---

## New i18n Keys (ar)

```json
"chat": {
  "title": "المحادثة",
  "placeholder": "اكتب رسالة...",
  "send": "إرسال",
  "empty": "لا توجد رسائل بعد. ابدأ المحادثة!",
  "open": "محادثة",
  "errorLoad": "تعذر تحميل الرسائل",
  "errorSend": "تعذر إرسال الرسالة"
}
```

---

## Implementation Order

1. Backend: Message schema + repository + service + REST controller
2. Backend: ChatGateway + Socket.io adapter wired into AppModule
3. Shared-types: `Message` interface
4. Frontend: `socket.ts` singleton + `useChat` hook
5. Frontend: `ChatDrawer` component
6. Frontend: Wire button + drawer into DriverBookingsPage
7. Frontend: Wire button + drawer into BookingsPage
