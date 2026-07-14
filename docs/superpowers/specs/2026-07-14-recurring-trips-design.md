# Recurring Trips System — Design Spec
**Date:** 2026-07-14  
**Status:** Approved

---

## Overview

Add a recurring/daily trip system to Wasslni. Drivers publish a trip template with a recurrence schedule; passengers subscribe once and get auto-booked on every matching occurrence. Individual `Ride` documents are generated nightly by a cron job — keeping all existing search, booking, and review flows unchanged.

---

## Data Model

### `recurring_trips` (new collection)

| Field | Type | Notes |
|-------|------|-------|
| `driverId` | ObjectId → User | required |
| `vehicleId` | ObjectId → Vehicle | required |
| `departureCityId` | ObjectId → City | required |
| `destinationCityId` | ObjectId → City | required |
| `departurePoint` | string | max 200 chars |
| `destinationPoint` | string? | optional |
| `departureTime` | string | HH:mm format |
| `price` | number | per seat |
| `totalSeats` | number | min 1 |
| `description` | string? | optional |
| `recurrence.type` | `'daily'` \| `'weekdays'` | |
| `recurrence.days` | number[] | 0–6 (Sun–Sat); empty = every day |
| `status` | `'active'` \| `'paused'` \| `'cancelled'` | default: active |
| `generatedUpTo` | Date | tracks cron progress; default: now |
| `createdAt` | Date | |
| `updatedAt` | Date | |

### `recurring_subscriptions` (new collection)

| Field | Type | Notes |
|-------|------|-------|
| `recurringTripId` | ObjectId → RecurringTrip | required, indexed |
| `passengerId` | ObjectId → User | required, indexed |
| `seats` | number | min 1 |
| `status` | `'pending'` \| `'active'` \| `'cancelled'` | default: pending |
| `scheduleDays` | number[] \| null | null = all days; [3] = Wednesdays only |
| `skippedDates` | string[] | YYYY-MM-DD dates passenger opted out of |
| `createdAt` | Date | |
| `updatedAt` | Date | |

**Compound unique index:** `{ recurringTripId, passengerId }` — one subscription per passenger per series.

### `rides` (existing — one new field)

```
recurringTripId?: ObjectId  // null for one-off rides; set for generated occurrences
```

No other changes to the rides collection. All existing indexes and flows are unaffected.

---

## Cron Job — Ride Generator

**Schedule:** Every night at 02:00 (NestJS `@Cron('0 2 * * *')`)  
**Horizon:** `today + 30 days` (rolling window — no end date)

### Algorithm

```
for each RecurringTrip where status = 'active':
  dates = computeDates(trip.recurrence, trip.generatedUpTo, today + 30 days)
  for each date in dates:
    if Ride.exists({ recurringTripId: trip._id, date }) → skip (idempotent)
    ride = Ride.create({ ...trip fields, date, availableSeats: totalSeats, recurringTripId })
    subscriptions = RecurringSubscription.find({ recurringTripId: trip._id, status: 'active' })
    for each subscription:
      if date.dayOfWeek not in subscription.scheduleDays (when not null) → skip
      if date in subscription.skippedDates → skip
      if Booking.exists({ rideId: ride._id, passengerId: subscription.passengerId }) → skip
      Booking.create({ rideId, passengerId, seats, status: 'Accepted' })
      ride.availableSeats -= subscription.seats  // atomic decrement
  trip.generatedUpTo = today + 30 days
```

**Idempotency:** The `Ride.exists` check before creation makes the job safe to re-run after crash or restart.

**Seat overflow guard:** If `availableSeats < subscription.seats`, skip that subscription and notify the passenger (seat conflict).

---

## API Endpoints

### Recurring Trips

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/recurring-trips` | Driver | Create recurring trip template |
| `GET` | `/recurring-trips/me` | Driver | List own recurring trips |
| `GET` | `/recurring-trips/:id` | Auth | Get one recurring trip |
| `PATCH` | `/recurring-trips/:id` | Driver (owner) | Edit template or pause/cancel series |
| `GET` | `/recurring-trips/:id/subscriptions` | Driver (owner) | List subscribers |

### Recurring Subscriptions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/recurring-trips/:id/subscribe` | Passenger | Subscribe to series |
| `POST` | `/recurring-subscriptions/:id/approve` | Driver | Approve subscription |
| `POST` | `/recurring-subscriptions/:id/reject` | Driver | Reject subscription |
| `POST` | `/recurring-subscriptions/:id/skip` | Passenger (owner) | Skip a specific date |
| `DELETE` | `/recurring-subscriptions/:id` | Passenger (owner) | Unsubscribe from series |
| `GET` | `/recurring-subscriptions/me` | Passenger | List own subscriptions |

---

## Subscription Flow

### Passenger subscribes
1. `POST /recurring-trips/:id/subscribe` with `{ seats, scheduleDays }`
   - `scheduleDays: null` = all matching days
   - `scheduleDays: [3]` = Wednesdays only
   - `scheduleDays: [1, 3, 5]` = Mon/Wed/Fri
2. `RecurringSubscription` created with `status: 'pending'`
3. Driver receives notification: `RecurringSubscriptionReceived`

### Driver approves
1. `POST /recurring-subscriptions/:id/approve`
2. Status → `active`
3. Next cron run auto-books passenger on all future matching rides
4. Passenger notified: `RecurringSubscriptionApproved`

### Driver rejects
1. `POST /recurring-subscriptions/:id/reject`
2. Status → `cancelled`
3. Passenger notified: `RecurringSubscriptionRejected`

### Passenger skips a day
1. `POST /recurring-subscriptions/:id/skip` with `{ date: "2026-07-16" }`
2. Date appended to `skippedDates`
3. If a `Booking` already exists for that ride → status set to `Cancelled`, `availableSeats` restored on the ride

### Passenger unsubscribes
1. `DELETE /recurring-subscriptions/:id`
2. Subscription status → `cancelled`
3. All future `Accepted` bookings (date > today) → `Cancelled`, seats freed
4. Past/current bookings untouched

### Driver pauses series
1. `PATCH /recurring-trips/:id` with `{ status: 'paused' }`
2. Cron stops generating new rides; subscriptions stay intact
3. Driver can resume by setting `status: 'active'`

### Driver cancels series
1. `PATCH /recurring-trips/:id` with `{ status: 'cancelled' }`
2. All future generated rides → `Cancelled`
3. All active subscriptions → `cancelled`
4. All future `Accepted` bookings → `Cancelled`, seats freed
5. All passengers notified: `RecurringTripCancelled`

---

## Frontend Changes

### Driver — Create Ride (extend existing page)
- Toggle: "رحلة يومية متكررة؟"
- If enabled: day-of-week checkboxes (Sun–Sat) or "كل يوم" (every day)
- Submits to `POST /recurring-trips` instead of `POST /rides`

### Driver — My Rides (new section)
- Tab or section: "رحلاتي المتكررة"
- Card per series: route, time, recurrence pattern, active subscriber count, status badge
- Actions: pause, cancel series
- Expandable subscriber list: name, seats, scheduleDays, approve/reject for pending

### Passenger — Search Results
- Recurring-generated rides appear as normal rides (they are real Ride docs)
- Badge: "🔁 رحلة متكررة"
- On ride detail page: "اشترك في هذه الرحلة المتكررة" button → modal to choose days + seats

### Passenger — My Bookings (extend existing)
- Recurring bookings grouped under series header with 🔁 badge
- Per-occurrence row: date, status, "تخطي هذا اليوم" (skip) button
- Series-level: "إلغاء الاشتراك" (unsubscribe) button

---

## Notifications (new types)

| Type | Recipient | Trigger |
|------|-----------|---------|
| `RecurringSubscriptionReceived` | Driver | Passenger subscribes |
| `RecurringSubscriptionApproved` | Passenger | Driver approves |
| `RecurringSubscriptionRejected` | Passenger | Driver rejects |
| `RecurringTripCancelled` | All subscribers | Driver cancels series |
| `RecurringSkipConfirmed` | Passenger | Skip processed, booking cancelled |

---

## Security & Validation

- Driver can only create/edit/cancel recurring trips they own (`driverId === userId`)
- Passenger can only manage their own subscriptions (`passengerId === userId`)
- Approve/reject only by the trip's driver
- `seats` on subscription must not exceed `totalSeats` on the recurring trip
- `scheduleDays` values must be 0–6; duplicate values rejected
- `skippedDates` must be valid YYYY-MM-DD strings, must be future dates
- Cron job runs as system — no user auth context, uses internal service calls only

---

## Implementation Modules

| Module | Changes |
|--------|---------|
| `shared-types` | New enums: `RecurringTripStatus`, `RecurringSubscriptionStatus`; new notification types; new model interfaces |
| `recurring-trips` | New NestJS module: schema, service, controller, repository |
| `recurring-subscriptions` | New NestJS module: schema, service, controller, repository |
| `scheduler` | New NestJS module using `@nestjs/schedule`; `RecurringRideGeneratorService` |
| `rides` | Add `recurringTripId` field to schema |
| `notifications` | Add 5 new notification type enum values |
| Frontend `api/` | New `recurringTrips.ts`, `recurringSubscriptions.ts` API modules |
| Frontend `pages/driver/` | Extend My Rides page; extend Create Ride form |
| Frontend `pages/passenger/` | Extend My Bookings page |
| Frontend `i18n/ar.json` | New translation keys |
