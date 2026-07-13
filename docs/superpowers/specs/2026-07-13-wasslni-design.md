# Wasslni / Covoiture — Full MVP Design Spec

**Date:** 2026-07-13
**Status:** Approved
**Source:** prd.md + brainstorming session

---

## 1. Product Summary

Arabic-first intercity carpooling platform (BlaBlaCar-style). Drivers publish trips between cities; passengers search and book seats. Full RTL UI. Three roles: Admin, Driver, Passenger.

Target markets: Morocco, Algeria, Tunisia, Egypt, Saudi Arabia, UAE, Jordan.

---

## 2. Technology Stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo |
| Backend | NestJS (Node.js) |
| Database | MongoDB + Mongoose |
| Local DB | Docker Compose |
| Prod DB | MongoDB Atlas |
| Auth | JWT (access in memory) + httpOnly cookie (refresh) |
| File uploads | Cloudinary via Multer |
| Transactional email | Resend |
| Frontend | Vite + React |
| Routing | React Router v6 |
| Server state | React Query v5 |
| Forms | React Hook Form + Zod |
| Styling | TailwindCSS (RTL logical properties) |
| i18n | i18next (ar default, fr + en secondary) |
| Deployment | Railway (two services: backend + frontend) |

---

## 3. Monorepo Structure

```
wasslni/
├── apps/
│   ├── backend/          # NestJS (port 3000)
│   └── frontend/         # Vite + React (port 5173)
├── packages/
│   ├── shared-types/     # Zod schemas + TS interfaces (used by both apps)
│   ├── shared-config/    # ESLint, Prettier configs
│   └── tsconfig/         # Shared tsconfig bases
├── docker/
│   └── docker-compose.yml  # MongoDB (27017) + Mongo Express (8081)
├── turbo.json
└── package.json
```

**Turbo pipeline:**
```json
{
  "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
  "dev":   { "persistent": true },
  "lint":  { "dependsOn": ["^lint"] }
}
```

---

## 4. Build Order (Vertical Slices)

Each slice ships backend + frontend together before the next starts.

| # | Slice | Key deliverables |
|---|---|---|
| 1 | Scaffold | Turborepo init, Docker Compose, shared packages, Railway config |
| 2 | Auth | Register, login, logout, refresh token, forgot/reset password |
| 3 | Profile + Cities + Vehicles | Profile CRUD, Cloudinary upload, admin city seeding, driver vehicles |
| 4 | Rides | Create/edit/cancel, search with filters + sorting |
| 5 | Bookings | Book seats, driver approve/reject, atomic seat decrement, history |
| 6 | Reviews + Reports | Mutual ratings, report submission |
| 7 | Admin Dashboard | User management, ban/delete, ride moderation, stats, city management |
| 8 | Notifications | In-app records + Resend email for booking events |

---

## 5. Backend Architecture (NestJS)

### Module Layout

```
src/
├── auth/           # JWT strategy, refresh token rotation, Passport guards
├── users/          # Profile, photo upload (Multer → Cloudinary)
├── cities/         # Admin-only CRUD, seeded list
├── vehicles/       # Driver-owned vehicles, ownership guard
├── rides/          # Ride CRUD, status machine, search query builder
├── bookings/       # Booking lifecycle, atomic seat decrement
├── reviews/        # Post-ride mutual ratings
├── reports/        # Report submission, admin moderation
├── notifications/  # Notification records + Resend email dispatch
├── admin/          # Aggregated stats, admin-only endpoints
└── common/
    ├── guards/         # JwtAuthGuard, RolesGuard
    ├── decorators/     # @CurrentUser(), @Roles()
    ├── filters/        # Global exception filter → structured error responses
    ├── interceptors/   # Request ID injection, response envelope
    └── pipes/          # Global ValidationPipe
```

### Cross-cutting Rules

- **Global `ValidationPipe`** with `whitelist: true, forbidNonWhitelisted: true` — unknown fields stripped on every request
- **Response envelope** — all responses: `{ success: boolean, data: T | null, error: { code, message, details } | null }`
- **Ownership guards** — `RideOwnerGuard`, `BookingOwnerGuard` etc. resolve resource, compare owner ID against `req.user._id` before any mutation
- **No cross-module service imports** — cross-cutting data accessed via injected repositories only
- **Swagger** at `/api/docs` in non-production environments

### Auth Flow (Backend)

1. `POST /auth/register` → hash password (bcrypt), create user, return tokens
2. `POST /auth/login` → verify credentials, issue access token (15m) in body + refresh token (7d) in httpOnly cookie
3. `POST /auth/refresh` → read cookie, verify refresh token hash, rotate (new token, invalidate old), return new access token
4. `POST /auth/logout` → clear refresh token hash in DB, clear cookie
5. `POST /auth/forgot-password` → generate reset token, send email via Resend
6. `POST /auth/reset-password` → validate token, hash new password, invalidate ALL refresh tokens for user

---

## 6. Data Models (MongoDB)

### Users
```
_id, fullName, email (unique), phone (unique sparse),
password (bcrypt), role (Admin|Driver|Passenger),
photo: { url, publicId },
rating: { average: number, count: number },
refreshTokenHash: string | null,
isActive: boolean,                    # false = banned
emailVerifiedAt: Date | null,          # optional for MVP, field reserved for Phase 2
createdAt, updatedAt
```

### Rides
```
_id, driverId → users, departureCityId → cities,
destinationCityId → cities, vehicleId → vehicles,
departurePoint: string, destinationPoint: string,
departureAt: Date,                    # date + time combined, indexed
price: number, totalSeats: number,
availableSeats: number,               # atomically decremented on booking accept
status: Scheduled | Full | Completed | Cancelled,
description: string,
createdAt, updatedAt
```

**Indexes:** `{ departureCityId, destinationCityId, departureAt, status, availableSeats }` compound

### Bookings
```
_id, rideId → rides, passengerId → users,
seats: number, status: Pending | Accepted | Rejected | Cancelled,
cancelledBy: Passenger | Driver | System | null,
createdAt, updatedAt
```

**Index:** `{ rideId, passengerId }` unique partial where `status != Cancelled` — prevents duplicate active bookings

### Cities
```
_id, nameAr: string, nameFr: string, lat: number, lng: number
```

### Vehicles
```
_id, driverId → users, brand, model, year, color, plate, seats: number
```

### Reviews
```
_id, rideId → rides, reviewerId → users, revieweeId → users,
rating: 1-5, comment: string, createdAt
```

### Reports
```
_id, reporterId → users, targetId → users | rides,
targetType: User | Ride, reason: Spam | Fraud | Unsafe | Other,
description: string, status: Pending | Reviewed | Dismissed,
createdAt
```

### Notifications
```
_id, userId → users, type: string, title: string, body: string,
data: object, read: boolean, createdAt
```

---

## 7. Frontend Architecture (React)

### Directory Layout
```
src/
├── api/            # One file per module (authApi.ts, ridesApi.ts, etc.)
├── components/     # Reusable UI (Button, Input, Card, Badge, Modal)
├── layouts/        # PublicLayout, PassengerLayout, DriverLayout, AdminLayout
├── pages/          # Route-level components, one folder per feature
├── hooks/          # useAuth, useCurrentUser, useBookingActions, etc.
├── store/          # AuthContext (access token in memory + user object)
├── routes/         # Route definitions, ProtectedRoute, RoleRoute
├── types/          # Re-exports from shared-types
└── utils/          # Date formatting, currency, cn() helper
```

### Auth Flow (Frontend)

1. Login → backend sets httpOnly refresh cookie, returns access token in body
2. Store access token in `AuthContext` (memory only, lost on page reload)
3. Axios interceptor attaches `Authorization: Bearer <token>` on every request
4. On 401 → call `/auth/refresh` (cookie sent automatically) → get new access token → retry original request
5. On app mount → call `/auth/refresh` to restore session from cookie

### Axios Instance
- Base URL from `VITE_API_URL` env var
- Request interceptor: attach access token
- Response interceptor: on 401 → silent refresh → retry (one retry only, logout on second 401)

### RTL + i18n
- `dir="rtl"` on `<html lang="ar">`
- TailwindCSS logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `rounded-s-`, `rounded-e-`)
- `i18next` — all strings in translation files, none hardcoded in JSX
- Language preference persisted to `localStorage`

### Pages

| Area | Pages |
|---|---|
| Public | Home, Search, Ride Details, Login, Register |
| Passenger | Dashboard, My Bookings, Notifications, Profile, Reviews |
| Driver | Dashboard, My Rides, Create Ride, Edit Ride, Booking Requests, Vehicles |
| Admin | Dashboard, Users, Cities, Trips, Reports, Reviews, Settings |

---

## 8. shared-types Package

Zod schemas defined once, used for:
- Backend DTO validation (via `nestjs-zod`)
- Frontend form validation (`zodResolver`)
- TypeScript types inferred via `z.infer<>`

One schema file per domain: `auth.schema.ts`, `ride.schema.ts`, `booking.schema.ts`, etc.

---

## 9. Seat Atomicity (Critical)

Booking acceptance uses a single atomic MongoDB operation:

```js
Ride.findOneAndUpdate(
  { _id: rideId, status: 'Scheduled', availableSeats: { $gte: requestedSeats } },
  { $inc: { availableSeats: -requestedSeats } },
  { new: true }
)
```

If this returns `null`, the seat was taken by a concurrent request — return 409 Conflict.
Auto-set status to `Full` if `availableSeats` reaches 0 after decrement.

---

## 10. Environment Variables

```bash
# backend/.env
MONGODB_URI
JWT_ACCESS_SECRET        # 64-char random
JWT_REFRESH_SECRET       # 64-char random
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RESEND_API_KEY
FRONTEND_URL             # for CORS allowlist
NODE_ENV

# frontend/.env
VITE_API_URL
```

---

## 11. Deployment (Railway)

- Two Railway services: `wasslni-backend` + `wasslni-frontend`
- Backend: Node Dockerfile, health check on `GET /health`
- Frontend: `vite build` → served via nginx static
- MongoDB Atlas URI injected as Railway env var for prod
- Refresh cookie: `SameSite=None; Secure` in prod, `SameSite=Lax` in dev

---

## 12. Security Baseline

- Helmet on all NestJS routes
- CORS allowlist: `FRONTEND_URL` only
- Rate limiting on all `/auth/*` endpoints (10 req/min)
- bcrypt with cost factor ≥ 12 for passwords
- Input sanitization before DB writes
- Audit logging for all admin mutations (who, what, when)
- Refresh token hash stored (never plaintext), rotated on every use
- All sessions invalidated on password reset
