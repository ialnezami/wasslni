# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Wasslni / Covoiture** — Arabic-first carpooling platform (BlaBlaCar-style) for Arabic-speaking markets. Drivers publish intercity trips; passengers search and book seats. Full RTL (Right-to-Left) UI support is a hard requirement.

The project is in pre-code phase. Source of truth: `prd.md`.

---

## Monorepo Structure

```
wasslni/
├── apps/
│   ├── backend/        # NestJS REST API
│   └── frontend/       # ReactJS SPA
├── packages/
│   ├── shared-types/   # TypeScript types/interfaces shared across apps
│   ├── shared-ui/      # Shared React components
│   └── shared-config/  # ESLint, Prettier, TS base configs
├── docker/             # Docker Compose for local infra
└── docs/
```

---

## Backend (NestJS)

**Stack:** NestJS · MongoDB · Mongoose · JWT + Passport · Swagger · class-validator · Multer

**Module layout** (`apps/backend/src/`):

```
auth/           # Register, login, logout, forgot/reset password, JWT refresh
users/          # Profile CRUD, photo upload (Multer)
rides/          # Driver creates/edits/cancels rides
bookings/       # Passenger books seats; driver accepts/rejects
cities/         # Admin-managed city list (nameAr, nameFr, lat, lng)
vehicles/       # Driver vehicle management (multiple per driver)
reviews/        # Mutual ratings (1–5 stars + comment)
reports/        # User/ride reports with reason enum
notifications/  # Notification records per user
admin/          # Admin dashboard, stats, ban/delete users
common/         # Guards, decorators, interceptors, filters, pipes
main.ts
```

**Roles (enum):** `Admin` | `Driver` | `Passenger` — enforced server-side on every route via role guard.

**Key domain rules:**
- Ride status: `Scheduled` → `Full` / `Completed` / `Cancelled`
- Booking status: `Pending` → `Accepted` / `Rejected` / `Cancelled`
- `availableSeats` on a ride must be decremented atomically when a booking is accepted; concurrent acceptance of the last seat must not oversell.
- Drivers manage multiple vehicles; a ride references one `vehicleId`.
- Cities are admin-seeded — drivers pick from the list, never free-text input.

**Auth:**
- JWT access token + refresh token pair
- Refresh token rotation on use
- Invalidate all sessions on password reset or email change

**Validation:** Use `class-validator` + `class-transformer` DTOs on every endpoint. Never trust client-supplied role or ownership fields.

---

## Frontend (ReactJS)

**Stack:** React · React Router · React Query · Axios · TailwindCSS · React Hook Form · Zod · i18next

**Directory layout** (`apps/frontend/src/`):

```
api/            # Axios instances and per-module API functions
assets/         # Images, fonts
components/     # Reusable UI components
layouts/        # Shell layouts (PublicLayout, DashboardLayout, AdminLayout)
pages/          # Route-level page components
hooks/          # Custom React hooks
services/       # Business logic wrapping API calls
store/          # Global state (auth context, etc.)
routes/         # Route definitions and protected route wrappers
types/          # TypeScript types (import from packages/shared-types when possible)
utils/          # Helpers
main.tsx
```

**RTL requirement:** All CSS, layout, and component decisions must support `dir="rtl"`. Use TailwindCSS logical properties (`ms-`, `me-`, `ps-`, `pe-`) instead of `ml-`/`mr-`/`pl-`/`pr-`.

**i18n:** Arabic is the primary locale. i18next with `ar` as default. French and English as secondary locales.

**Auth flow:** JWT stored in memory (access token) + httpOnly cookie (refresh token). React Query handles token refresh transparently via Axios interceptor.

---

## Planned Pages

| Area | Pages |
|------|-------|
| Public | Home, Search, Ride Details, Login, Register, About, Contact |
| Passenger | Dashboard, My Bookings, Notifications, Profile, Reviews |
| Driver | Dashboard, My Rides, Create Ride, Edit Ride, Booking Requests, Vehicles |
| Admin | Dashboard, Users, Drivers, Passengers, Cities, Trips, Reports, Reviews, Settings |

---

## Security Baseline

Every feature must satisfy these from the start — not as future cleanup:

- Helmet + CORS on all NestJS routes
- Rate limiting on auth endpoints
- bcrypt for passwords (no MD5/SHA1)
- Input sanitization before DB writes
- Audit logging for all admin mutations
- Ownership check on every driver/passenger resource mutation (the requesting user must own the resource)
