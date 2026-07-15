# Recurring Trips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a recurring/daily trip system — drivers publish a template with a recurrence schedule; passengers subscribe once and are auto-booked on each matching occurrence; a nightly cron generates individual Ride documents 30 days ahead.

**Architecture:** Template + Generator pattern. Two new NestJS modules (recurring-trips, recurring-subscriptions) store templates and subscriptions. A SchedulerModule with `@Cron('0 2 * * *')` generates real `Ride` documents and `Booking` documents each night. Individual Rides remain the unit of search/booking — zero changes to existing flows. Cancel cascade (when driver cancels the series) runs on the next cron tick via a `cascadeProcessedAt` sentinel field.

**Tech Stack:** NestJS · @nestjs/schedule · MongoDB/Mongoose · class-validator · class-transformer · React · React Query · Zustand · TailwindCSS RTL logical properties · i18next Arabic

## Global Constraints

- Arabic is primary locale; every new UI string needs an `ar.json` entry
- RTL layout: use `ms-`/`me-`/`ps-`/`pe-` Tailwind logical properties, never `ml-`/`mr-`/`pl-`/`pr-`
- All ownership checks server-side — never trust client-supplied ownership or role fields
- Mongoose queries must include `deletedAt: null` (soft-delete pattern used throughout)
- `@wasslni/shared-types` is the single source of truth for interfaces shared across apps
- Follow existing module pattern exactly: schema → repository → service → controller → module
- No circular module dependencies — RecurringSubscriptionsModule imports RecurringTripsModule; RecurringTripsModule does not import RecurringSubscriptionsModule; cancel cascade runs in SchedulerModule

---

## File Map

**New backend:**
```
apps/backend/src/
├── recurring-trips/
│   ├── schemas/recurring-trip.schema.ts
│   ├── repositories/recurring-trips.repository.ts
│   ├── dto/recurring-trips.dto.ts
│   ├── recurring-trips.service.ts
│   ├── recurring-trips.controller.ts
│   └── recurring-trips.module.ts
├── recurring-subscriptions/
│   ├── schemas/recurring-subscription.schema.ts
│   ├── repositories/recurring-subscriptions.repository.ts
│   ├── dto/recurring-subscriptions.dto.ts
│   ├── recurring-subscriptions.service.ts
│   ├── recurring-subscriptions.controller.ts
│   └── recurring-subscriptions.module.ts
└── scheduler/
    ├── recurring-ride-generator.service.ts
    └── scheduler.module.ts
```

**Modified backend:**
```
apps/backend/src/
├── rides/schemas/ride.schema.ts            — add recurringTripId field
├── rides/repositories/rides.repository.ts  — add findByRecurringTripAndDate, findFutureByRecurringTrip
└── app.module.ts                           — add ScheduleModule.forRoot() + 3 new modules
```

**Shared types:**
```
packages/shared-types/src/
├── enums.ts   — add RecurringTripStatus, RecurringSubscriptionStatus, 5 NotificationType values
└── models.ts  — add RecurringTrip, RecurringSubscription interfaces; extend Ride with recurringTripId
```

**New/modified frontend:**
```
apps/frontend/src/
├── api/recurringTrips.ts              — new
├── api/recurringSubscriptions.ts     — new
├── pages/driver/CreateRidePage.tsx   — add recurring toggle + day picker
├── pages/driver/MyRidesPage.tsx      — add recurring trips section
├── pages/passenger/BookingsPage.tsx  — add recurring subscriptions section
└── i18n/locales/ar.json              — new keys
```

---

### Task 1: Shared Types — Enums and Model Interfaces

**Files:**
- Modify: `packages/shared-types/src/enums.ts`
- Modify: `packages/shared-types/src/models.ts`

**Interfaces:**
- Produces: `RecurringTripStatus`, `RecurringSubscriptionStatus`, `RecurringTrip`, `RecurringSubscription` — consumed by all later tasks

- [ ] **Step 1: Add new enums and extend NotificationType in enums.ts**

Open `packages/shared-types/src/enums.ts` and add the following after the existing enums:

```typescript
export enum RecurringTripStatus {
  Active = 'active',
  Paused = 'paused',
  Cancelled = 'cancelled',
}

export enum RecurringSubscriptionStatus {
  Pending = 'pending',
  Active = 'active',
  Cancelled = 'cancelled',
}
```

Also extend the existing `NotificationType` enum — add these 5 values:

```typescript
  RecurringSubscriptionReceived = 'RecurringSubscriptionReceived',
  RecurringSubscriptionApproved = 'RecurringSubscriptionApproved',
  RecurringSubscriptionRejected = 'RecurringSubscriptionRejected',
  RecurringTripCancelled = 'RecurringTripCancelled',
  RecurringSkipConfirmed = 'RecurringSkipConfirmed',
```

- [ ] **Step 2: Add model interfaces and extend Ride in models.ts**

Open `packages/shared-types/src/models.ts` and add:

1. Extend the existing `Ride` interface — add one optional field:
```typescript
  recurringTripId?: string;
```

2. Add two new interfaces at the end of the file:
```typescript
export interface RecurringTrip extends BaseEntity {
  driverId: string;
  vehicleId: string;
  departureCityId: string;
  destinationCityId: string;
  departurePoint: string;
  destinationPoint?: string;
  departureTime: string;
  price: number;
  totalSeats: number;
  description?: string;
  recurrence: {
    type: 'daily' | 'weekdays';
    days: number[];
  };
  status: RecurringTripStatus;
  generatedUpTo: string;
  cascadeProcessedAt?: string | null;
}

export interface RecurringSubscription extends BaseEntity {
  recurringTripId: string;
  passengerId: string;
  seats: number;
  status: RecurringSubscriptionStatus;
  scheduleDays: number[] | null;
  skippedDates: string[];
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd packages/shared-types && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/shared-types/src/enums.ts packages/shared-types/src/models.ts
git commit -m "feat(shared-types): add recurring trip enums, notification types, and model interfaces"
```

---

### Task 2: Install @nestjs/schedule and Wire ScheduleModule

**Files:**
- Modify: `apps/backend/package.json` (via npm install)
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Produces: `ScheduleModule.forRoot()` available for Task 6's `@Cron` decorator

- [ ] **Step 1: Install @nestjs/schedule**

```bash
cd apps/backend && npm install @nestjs/schedule
```

Expected output ends with: `added N packages` (no errors).

- [ ] **Step 2: Add ScheduleModule to AppModule**

Open `apps/backend/src/app.module.ts`. Add the import at the top:

```typescript
import { ScheduleModule } from '@nestjs/schedule';
```

Add `ScheduleModule.forRoot()` to the `imports` array (after `ThrottlerModule`):

```typescript
ScheduleModule.forRoot(),
```

- [ ] **Step 3: Verify backend compiles**

```bash
cd apps/backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/package.json apps/backend/package-lock.json apps/backend/src/app.module.ts
git commit -m "feat(backend): install @nestjs/schedule and register ScheduleModule"
```

---

### Task 3: Extend Ride Schema and Repository

**Files:**
- Modify: `apps/backend/src/rides/schemas/ride.schema.ts`
- Modify: `apps/backend/src/rides/repositories/rides.repository.ts`

**Interfaces:**
- Produces:
  - `ridesRepository.findByRecurringTripAndDate(recurringTripId: string, date: string): Promise<Ride | null>`
  - `ridesRepository.findFutureByRecurringTrip(recurringTripId: string, afterDate: string): Promise<Ride[]>`
- Consumed by: Task 5 (RecurringSubscriptionsService), Task 6 (SchedulerService)

- [ ] **Step 1: Add recurringTripId field to ride.schema.ts**

Open `apps/backend/src/rides/schemas/ride.schema.ts`. After the `description` prop, add:

```typescript
  @Prop({ type: Types.ObjectId, ref: 'RecurringTrip', index: true, default: null })
  recurringTripId?: Types.ObjectId | null;
```

- [ ] **Step 2: Add two query methods to rides.repository.ts**

Open `apps/backend/src/rides/repositories/rides.repository.ts`. Add these two methods after `count()`:

```typescript
  findByRecurringTripAndDate(recurringTripId: string, date: string) {
    return this.rideModel.findOne({ recurringTripId, date, deletedAt: null }).exec();
  }

  findFutureByRecurringTrip(recurringTripId: string, afterDate: string) {
    return this.rideModel
      .find({
        recurringTripId,
        date: { $gt: afterDate },
        status: { $in: [RideStatus.Scheduled, RideStatus.Full] },
        deletedAt: null,
      })
      .exec();
  }
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/rides/schemas/ride.schema.ts apps/backend/src/rides/repositories/rides.repository.ts
git commit -m "feat(rides): add recurringTripId field and recurring query methods"
```

---

### Task 4: RecurringTrip Backend Module

**Files:**
- Create: `apps/backend/src/recurring-trips/schemas/recurring-trip.schema.ts`
- Create: `apps/backend/src/recurring-trips/repositories/recurring-trips.repository.ts`
- Create: `apps/backend/src/recurring-trips/dto/recurring-trips.dto.ts`
- Create: `apps/backend/src/recurring-trips/recurring-trips.service.ts`
- Create: `apps/backend/src/recurring-trips/recurring-trips.controller.ts`
- Create: `apps/backend/src/recurring-trips/recurring-trips.module.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Produces:
  - `RecurringTripsRepository` exported — consumed by Tasks 5 and 6
  - `RecurringTripsService` exported — consumed by Task 5
  - REST endpoints: `GET /recurring-trips/me`, `POST /recurring-trips`, `GET /recurring-trips/:id`, `PATCH /recurring-trips/:id`, `GET /recurring-trips/:id/subscriptions`

- [ ] **Step 1: Create the schema**

Create `apps/backend/src/recurring-trips/schemas/recurring-trip.schema.ts`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { RecurringTripStatus } from '@wasslni/shared-types';
import { BaseDocument } from '../../database/base.schema';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'recurring_trips' })
export class RecurringTrip extends BaseDocument {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  driverId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true })
  vehicleId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'City', required: true, index: true })
  departureCityId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'City', required: true, index: true })
  destinationCityId!: Types.ObjectId;

  @Prop({ required: true })
  departurePoint!: string;

  @Prop()
  destinationPoint?: string;

  @Prop({ required: true })
  departureTime!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  totalSeats!: number;

  @Prop()
  description?: string;

  @Prop({ type: Object, required: true })
  recurrence!: { type: 'daily' | 'weekdays'; days: number[] };

  @Prop({ required: true, enum: RecurringTripStatus, default: RecurringTripStatus.Active, index: true })
  status!: RecurringTripStatus;

  @Prop({ required: true, type: Date })
  generatedUpTo!: Date;

  @Prop({ type: Date, default: null })
  cascadeProcessedAt?: Date | null;
}

export const RecurringTripSchema = SchemaFactory.createForClass(RecurringTrip);
```

- [ ] **Step 2: Create the repository**

Create `apps/backend/src/recurring-trips/repositories/recurring-trips.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecurringTrip } from '../schemas/recurring-trip.schema';
import { RecurringTripStatus } from '@wasslni/shared-types';

@Injectable()
export class RecurringTripsRepository {
  constructor(@InjectModel(RecurringTrip.name) private readonly model: Model<RecurringTrip>) {}

  findById(id: string) {
    return this.model.findOne({ _id: id, deletedAt: null }).exec();
  }

  findByDriver(driverId: string) {
    return this.model.find({ driverId, deletedAt: null }).sort({ createdAt: -1 }).exec();
  }

  findAllActive() {
    return this.model.find({ status: RecurringTripStatus.Active, deletedAt: null }).exec();
  }

  findCancelledUnprocessed() {
    return this.model
      .find({ status: RecurringTripStatus.Cancelled, cascadeProcessedAt: null, deletedAt: null })
      .exec();
  }

  create(data: Partial<RecurringTrip>) {
    return this.model.create(data);
  }

  updateById(id: string, data: Partial<RecurringTrip>) {
    return this.model.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).exec();
  }

  updateGeneratedUpTo(id: string, date: Date) {
    return this.model.findOneAndUpdate({ _id: id }, { generatedUpTo: date }, { new: true }).exec();
  }
}
```

- [ ] **Step 3: Create the DTOs**

Create `apps/backend/src/recurring-trips/dto/recurring-trips.dto.ts`:

```typescript
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { RecurringTripStatus } from '@wasslni/shared-types';

class RecurrenceDto {
  @IsEnum(['daily', 'weekdays'])
  type!: 'daily' | 'weekdays';

  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days!: number[];
}

export class CreateRecurringTripDto {
  @IsMongoId() vehicleId!: string;
  @IsMongoId() departureCityId!: string;
  @IsMongoId() destinationCityId!: string;
  @IsString() @MaxLength(200) departurePoint!: string;
  @IsOptional() @IsString() @MaxLength(200) destinationPoint?: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) departureTime!: string;
  @Type(() => Number) @IsPositive() price!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(8) totalSeats!: number;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @ValidateNested() @Type(() => RecurrenceDto) recurrence!: RecurrenceDto;
}

export class UpdateRecurringTripDto {
  @IsOptional() @IsEnum(RecurringTripStatus) status?: RecurringTripStatus;
  @IsOptional() @Type(() => Number) @IsPositive() price?: number;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}
```

- [ ] **Step 4: Create the service**

Create `apps/backend/src/recurring-trips/recurring-trips.service.ts`:

```typescript
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RecurringTripStatus } from '@wasslni/shared-types';
import { RecurringTripsRepository } from './repositories/recurring-trips.repository';
import { VehiclesRepository } from '../vehicles/repositories/vehicles.repository';
import { CreateRecurringTripDto, UpdateRecurringTripDto } from './dto/recurring-trips.dto';

@Injectable()
export class RecurringTripsService {
  constructor(
    private readonly recurringTripsRepository: RecurringTripsRepository,
    private readonly vehiclesRepository: VehiclesRepository,
  ) {}

  findMine(driverId: string) {
    return this.recurringTripsRepository.findByDriver(driverId);
  }

  async findOne(id: string) {
    const trip = await this.recurringTripsRepository.findById(id);
    if (!trip) throw new NotFoundException('Recurring trip not found');
    return trip;
  }

  async create(driverId: string, dto: CreateRecurringTripDto) {
    if (dto.departureCityId === dto.destinationCityId) {
      throw new BadRequestException('Departure and destination cities must differ');
    }
    if (dto.recurrence.type === 'weekdays' && dto.recurrence.days.length === 0) {
      throw new BadRequestException('Weekdays recurrence requires at least one day selected');
    }
    const vehicle = await this.vehiclesRepository.findByIdAndDriver(dto.vehicleId, driverId);
    if (!vehicle) throw new BadRequestException('Vehicle not found or does not belong to you');
    if (dto.totalSeats > vehicle.seats) throw new BadRequestException('Seats exceed vehicle capacity');

    const days = [...new Set(dto.recurrence.days)];
    return this.recurringTripsRepository.create({
      ...dto,
      recurrence: { type: dto.recurrence.type, days },
      driverId: driverId as never,
      status: RecurringTripStatus.Active,
      generatedUpTo: new Date(),
      cascadeProcessedAt: null,
    } as Partial<import('./schemas/recurring-trip.schema').RecurringTrip>);
  }

  async update(id: string, driverId: string, dto: UpdateRecurringTripDto) {
    const trip = await this.findOne(id);
    if (String(trip.driverId) !== driverId) throw new ForbiddenException('You do not own this recurring trip');
    if (trip.status === RecurringTripStatus.Cancelled) throw new BadRequestException('Cancelled trips cannot be modified');
    return this.recurringTripsRepository.updateById(
      id,
      dto as Partial<import('./schemas/recurring-trip.schema').RecurringTrip>,
    );
  }

  async getSubscriptions(id: string, driverId: string) {
    const trip = await this.findOne(id);
    if (String(trip.driverId) !== driverId) throw new ForbiddenException('You do not own this recurring trip');
    return trip;
  }
}
```

- [ ] **Step 5: Create the controller**

Create `apps/backend/src/recurring-trips/recurring-trips.controller.ts`:

```typescript
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@wasslni/shared-types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RecurringTripsService } from './recurring-trips.service';
import { CreateRecurringTripDto, UpdateRecurringTripDto } from './dto/recurring-trips.dto';

@ApiTags('recurring-trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recurring-trips')
export class RecurringTripsController {
  constructor(private readonly recurringTripsService: RecurringTripsService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthUser) {
    return this.recurringTripsService.findMine(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRecurringTripDto) {
    return this.recurringTripsService.create(user.userId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recurringTripsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateRecurringTripDto) {
    return this.recurringTripsService.update(id, user.userId, dto);
  }

  @Get(':id/subscriptions')
  getSubscriptions(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.recurringTripsService.getSubscriptions(id, user.userId);
  }
}
```

- [ ] **Step 6: Create the module**

Create `apps/backend/src/recurring-trips/recurring-trips.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecurringTripsController } from './recurring-trips.controller';
import { RecurringTripsService } from './recurring-trips.service';
import { RecurringTripsRepository } from './repositories/recurring-trips.repository';
import { RecurringTrip, RecurringTripSchema } from './schemas/recurring-trip.schema';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RecurringTrip.name, schema: RecurringTripSchema }]),
    VehiclesModule,
  ],
  controllers: [RecurringTripsController],
  providers: [RecurringTripsService, RecurringTripsRepository],
  exports: [RecurringTripsService, RecurringTripsRepository],
})
export class RecurringTripsModule {}
```

- [ ] **Step 7: Register in AppModule**

Open `apps/backend/src/app.module.ts`. Add import:
```typescript
import { RecurringTripsModule } from './recurring-trips/recurring-trips.module';
```
Add `RecurringTripsModule` to the `imports` array.

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Verify endpoints exist**

```bash
curl -s http://localhost:3000/api | grep -i recurring
```

Expected: Swagger shows `recurring-trips` tag (or use `curl http://localhost:3000/recurring-trips/me -H "Authorization: Bearer <token>"`).

- [ ] **Step 10: Commit**

```bash
git add apps/backend/src/recurring-trips/ apps/backend/src/app.module.ts
git commit -m "feat(recurring-trips): add RecurringTrip schema, repository, service, controller, and module"
```

---

### Task 5: RecurringSubscription Backend Module

**Files:**
- Create: `apps/backend/src/recurring-subscriptions/schemas/recurring-subscription.schema.ts`
- Create: `apps/backend/src/recurring-subscriptions/repositories/recurring-subscriptions.repository.ts`
- Create: `apps/backend/src/recurring-subscriptions/dto/recurring-subscriptions.dto.ts`
- Create: `apps/backend/src/recurring-subscriptions/recurring-subscriptions.service.ts`
- Create: `apps/backend/src/recurring-subscriptions/recurring-subscriptions.controller.ts`
- Create: `apps/backend/src/recurring-subscriptions/recurring-subscriptions.module.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: `RecurringTripsRepository` (from Task 4), `RidesRepository.findByRecurringTripAndDate` and `findFutureByRecurringTrip` (from Task 3), `BookingsRepository` (existing), `NotificationsService` (existing)
- Produces:
  - `RecurringSubscriptionsRepository` exported — consumed by Task 6
  - REST endpoints: `POST /recurring-trips/:id/subscribe`, `POST /recurring-subscriptions/:id/approve`, `POST /recurring-subscriptions/:id/reject`, `POST /recurring-subscriptions/:id/skip`, `DELETE /recurring-subscriptions/:id`, `GET /recurring-subscriptions/me`

- [ ] **Step 1: Create the schema**

Create `apps/backend/src/recurring-subscriptions/schemas/recurring-subscription.schema.ts`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { RecurringSubscriptionStatus } from '@wasslni/shared-types';
import { BaseDocument } from '../../database/base.schema';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'recurring_subscriptions' })
export class RecurringSubscription extends BaseDocument {
  @Prop({ type: Types.ObjectId, ref: 'RecurringTrip', required: true, index: true })
  recurringTripId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  passengerId!: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  seats!: number;

  @Prop({ required: true, enum: RecurringSubscriptionStatus, default: RecurringSubscriptionStatus.Pending })
  status!: RecurringSubscriptionStatus;

  @Prop({ type: [Number], default: null })
  scheduleDays!: number[] | null;

  @Prop({ type: [String], default: [] })
  skippedDates!: string[];
}

export const RecurringSubscriptionSchema = SchemaFactory.createForClass(RecurringSubscription);
RecurringSubscriptionSchema.index({ recurringTripId: 1, passengerId: 1 }, { unique: true, sparse: true });
```

- [ ] **Step 2: Create the repository**

Create `apps/backend/src/recurring-subscriptions/repositories/recurring-subscriptions.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecurringSubscription } from '../schemas/recurring-subscription.schema';
import { RecurringSubscriptionStatus } from '@wasslni/shared-types';

@Injectable()
export class RecurringSubscriptionsRepository {
  constructor(
    @InjectModel(RecurringSubscription.name) private readonly model: Model<RecurringSubscription>,
  ) {}

  findById(id: string) {
    return this.model.findOne({ _id: id, deletedAt: null }).exec();
  }

  findByRecurringTrip(recurringTripId: string) {
    return this.model.find({ recurringTripId, deletedAt: null }).sort({ createdAt: -1 }).exec();
  }

  findActiveByRecurringTrip(recurringTripId: string) {
    return this.model
      .find({ recurringTripId, status: RecurringSubscriptionStatus.Active, deletedAt: null })
      .exec();
  }

  findByTripAndPassenger(recurringTripId: string, passengerId: string) {
    return this.model.findOne({ recurringTripId, passengerId, deletedAt: null }).exec();
  }

  findByPassenger(passengerId: string) {
    return this.model.find({ passengerId, deletedAt: null }).sort({ createdAt: -1 }).exec();
  }

  create(data: Partial<RecurringSubscription>) {
    return this.model.create(data);
  }

  updateById(id: string, data: Partial<RecurringSubscription>) {
    return this.model.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).exec();
  }

  addSkippedDate(id: string, date: string) {
    return this.model
      .findOneAndUpdate({ _id: id, deletedAt: null }, { $addToSet: { skippedDates: date } }, { new: true })
      .exec();
  }
}
```

- [ ] **Step 3: Create the DTOs**

Create `apps/backend/src/recurring-subscriptions/dto/recurring-subscriptions.dto.ts`:

```typescript
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNullable, IsOptional, Max, Min } from 'class-validator';

export class CreateSubscriptionDto {
  @Type(() => Number) @IsInt() @Min(1) seats!: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  scheduleDays?: number[] | null;
}

export class SkipDateDto {
  @IsDateString() date!: string;
}
```

- [ ] **Step 4: Create the service**

Create `apps/backend/src/recurring-subscriptions/recurring-subscriptions.service.ts`:

```typescript
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, NotificationType, PaymentStatus, RecurringSubscriptionStatus, RecurringTripStatus } from '@wasslni/shared-types';
import { RecurringSubscriptionsRepository } from './repositories/recurring-subscriptions.repository';
import { RecurringTripsRepository } from '../recurring-trips/repositories/recurring-trips.repository';
import { RidesRepository } from '../rides/repositories/rides.repository';
import { BookingsRepository } from '../bookings/repositories/bookings.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSubscriptionDto, SkipDateDto } from './dto/recurring-subscriptions.dto';

@Injectable()
export class RecurringSubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: RecurringSubscriptionsRepository,
    private readonly recurringTripsRepository: RecurringTripsRepository,
    private readonly ridesRepository: RidesRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  findMine(passengerId: string) {
    return this.subscriptionsRepository.findByPassenger(passengerId);
  }

  async subscribe(recurringTripId: string, passengerId: string, dto: CreateSubscriptionDto) {
    const trip = await this.recurringTripsRepository.findById(recurringTripId);
    if (!trip) throw new NotFoundException('Recurring trip not found');
    if (trip.status !== RecurringTripStatus.Active) {
      throw new BadRequestException('This trip is not currently accepting subscriptions');
    }
    if (dto.seats > trip.totalSeats) {
      throw new BadRequestException('Requested seats exceed trip capacity');
    }

    const existing = await this.subscriptionsRepository.findByTripAndPassenger(recurringTripId, passengerId);
    if (existing && existing.status !== RecurringSubscriptionStatus.Cancelled) {
      throw new ConflictException('You are already subscribed to this trip');
    }

    const subscription = await this.subscriptionsRepository.create({
      recurringTripId: recurringTripId as never,
      passengerId: passengerId as never,
      seats: dto.seats,
      status: RecurringSubscriptionStatus.Pending,
      scheduleDays: dto.scheduleDays ?? null,
      skippedDates: [],
    } as Partial<import('./schemas/recurring-subscription.schema').RecurringSubscription>);

    await this.notificationsService.create(
      String(trip.driverId),
      NotificationType.RecurringSubscriptionReceived,
      'طلب اشتراك جديد',
      'راكب جديد يريد الانضمام لرحلتك اليومية',
      { subscriptionId: String(subscription._id), recurringTripId },
    );

    return subscription;
  }

  async approve(subscriptionId: string, driverId: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status !== RecurringSubscriptionStatus.Pending) {
      throw new BadRequestException('Subscription is not pending');
    }

    const trip = await this.recurringTripsRepository.findById(String(sub.recurringTripId));
    if (!trip || String(trip.driverId) !== driverId) {
      throw new ForbiddenException('You do not own this trip');
    }

    await this.subscriptionsRepository.updateById(subscriptionId, {
      status: RecurringSubscriptionStatus.Active,
    } as Partial<import('./schemas/recurring-subscription.schema').RecurringSubscription>);

    await this.notificationsService.create(
      String(sub.passengerId),
      NotificationType.RecurringSubscriptionApproved,
      'تم قبول اشتراكك',
      'وافق السائق على اشتراكك في رحلته اليومية. ستُحجز لك مقاعد تلقائياً.',
      { subscriptionId, recurringTripId: String(sub.recurringTripId) },
    );

    return this.subscriptionsRepository.findById(subscriptionId);
  }

  async reject(subscriptionId: string, driverId: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status !== RecurringSubscriptionStatus.Pending) {
      throw new BadRequestException('Subscription is not pending');
    }

    const trip = await this.recurringTripsRepository.findById(String(sub.recurringTripId));
    if (!trip || String(trip.driverId) !== driverId) {
      throw new ForbiddenException('You do not own this trip');
    }

    await this.subscriptionsRepository.updateById(subscriptionId, {
      status: RecurringSubscriptionStatus.Cancelled,
    } as Partial<import('./schemas/recurring-subscription.schema').RecurringSubscription>);

    await this.notificationsService.create(
      String(sub.passengerId),
      NotificationType.RecurringSubscriptionRejected,
      'تم رفض اشتراكك',
      'رفض السائق طلب اشتراكك في رحلته اليومية.',
      { subscriptionId, recurringTripId: String(sub.recurringTripId) },
    );

    return this.subscriptionsRepository.findById(subscriptionId);
  }

  async skipDate(subscriptionId: string, passengerId: string, dto: SkipDateDto) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');
    if (String(sub.passengerId) !== passengerId) throw new ForbiddenException('You do not own this subscription');
    if (sub.status !== RecurringSubscriptionStatus.Active) {
      throw new BadRequestException('Subscription is not active');
    }

    const today = new Date().toISOString().split('T')[0];
    if (dto.date <= today) throw new BadRequestException('Can only skip future dates');
    if (sub.skippedDates.includes(dto.date)) throw new ConflictException('Date already skipped');

    await this.subscriptionsRepository.addSkippedDate(subscriptionId, dto.date);

    const ride = await this.ridesRepository.findByRecurringTripAndDate(String(sub.recurringTripId), dto.date);
    if (ride) {
      const booking = await this.bookingsRepository.findActiveByRideAndPassenger(
        String(ride._id),
        passengerId,
      );
      if (booking && [BookingStatus.Pending, BookingStatus.Accepted].includes(booking.status)) {
        await this.bookingsRepository.updateStatus(String(booking._id), BookingStatus.Cancelled);
        await this.ridesRepository.releaseSeats(String(ride._id), sub.seats);
      }
    }

    await this.notificationsService.create(
      passengerId,
      NotificationType.RecurringSkipConfirmed,
      'تم تخطي اليوم',
      `تم إلغاء حجزك ليوم ${dto.date} بنجاح.`,
      { subscriptionId, date: dto.date },
    );

    return this.subscriptionsRepository.findById(subscriptionId);
  }

  async unsubscribe(subscriptionId: string, passengerId: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');
    if (String(sub.passengerId) !== passengerId) throw new ForbiddenException('You do not own this subscription');
    if (sub.status === RecurringSubscriptionStatus.Cancelled) {
      throw new BadRequestException('Already unsubscribed');
    }

    await this.subscriptionsRepository.updateById(subscriptionId, {
      status: RecurringSubscriptionStatus.Cancelled,
    } as Partial<import('./schemas/recurring-subscription.schema').RecurringSubscription>);

    const today = new Date().toISOString().split('T')[0];
    const futureRides = await this.ridesRepository.findFutureByRecurringTrip(
      String(sub.recurringTripId),
      today,
    );

    for (const ride of futureRides) {
      const booking = await this.bookingsRepository.findActiveByRideAndPassenger(
        String(ride._id),
        passengerId,
      );
      if (booking) {
        await this.bookingsRepository.updateStatus(String(booking._id), BookingStatus.Cancelled);
        await this.ridesRepository.releaseSeats(String(ride._id), sub.seats);
      }
    }

    return { message: 'Unsubscribed successfully' };
  }
}
```

- [ ] **Step 5: Create the controller**

Create `apps/backend/src/recurring-subscriptions/recurring-subscriptions.controller.ts`:

```typescript
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '@wasslni/shared-types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RecurringSubscriptionsService } from './recurring-subscriptions.service';
import { CreateSubscriptionDto, SkipDateDto } from './dto/recurring-subscriptions.dto';

@ApiTags('recurring-subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class RecurringSubscriptionsController {
  constructor(private readonly subscriptionsService: RecurringSubscriptionsService) {}

  @Get('recurring-subscriptions/me')
  findMine(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.findMine(user.userId);
  }

  @Post('recurring-trips/:id/subscribe')
  subscribe(
    @Param('id') recurringTripId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.subscribe(recurringTripId, user.userId, dto);
  }

  @Post('recurring-subscriptions/:id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.subscriptionsService.approve(id, user.userId);
  }

  @Post('recurring-subscriptions/:id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.subscriptionsService.reject(id, user.userId);
  }

  @Post('recurring-subscriptions/:id/skip')
  skipDate(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: SkipDateDto) {
    return this.subscriptionsService.skipDate(id, user.userId, dto);
  }

  @Delete('recurring-subscriptions/:id')
  unsubscribe(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.subscriptionsService.unsubscribe(id, user.userId);
  }
}
```

- [ ] **Step 6: Create the module**

Create `apps/backend/src/recurring-subscriptions/recurring-subscriptions.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecurringSubscriptionsController } from './recurring-subscriptions.controller';
import { RecurringSubscriptionsService } from './recurring-subscriptions.service';
import { RecurringSubscriptionsRepository } from './repositories/recurring-subscriptions.repository';
import { RecurringSubscription, RecurringSubscriptionSchema } from './schemas/recurring-subscription.schema';
import { RecurringTripsModule } from '../recurring-trips/recurring-trips.module';
import { RidesModule } from '../rides/rides.module';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RecurringSubscription.name, schema: RecurringSubscriptionSchema },
    ]),
    RecurringTripsModule,
    RidesModule,
    BookingsModule,
    NotificationsModule,
  ],
  controllers: [RecurringSubscriptionsController],
  providers: [RecurringSubscriptionsService, RecurringSubscriptionsRepository],
  exports: [RecurringSubscriptionsService, RecurringSubscriptionsRepository],
})
export class RecurringSubscriptionsModule {}
```

- [ ] **Step 7: Register in AppModule**

Open `apps/backend/src/app.module.ts`. Add import:
```typescript
import { RecurringSubscriptionsModule } from './recurring-subscriptions/recurring-subscriptions.module';
```
Add `RecurringSubscriptionsModule` to the `imports` array.

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Test subscribe endpoint**

Start the backend and test:
```bash
curl -X POST http://localhost:3000/recurring-trips/SOME_ID/subscribe \
  -H "Authorization: Bearer <passenger_token>" \
  -H "Content-Type: application/json" \
  -d '{"seats": 1, "scheduleDays": null}'
```

Expected: `201` with subscription object, status `pending`.

- [ ] **Step 10: Commit**

```bash
git add apps/backend/src/recurring-subscriptions/ apps/backend/src/app.module.ts
git commit -m "feat(recurring-subscriptions): add subscription schema, repository, service, controller, and module"
```

---

### Task 6: Scheduler Module — Nightly Ride Generator

**Files:**
- Create: `apps/backend/src/scheduler/recurring-ride-generator.service.ts`
- Create: `apps/backend/src/scheduler/scheduler.module.ts`
- Modify: `apps/backend/src/app.module.ts`

**Interfaces:**
- Consumes: `RecurringTripsRepository` (Task 4), `RecurringSubscriptionsRepository` (Task 5), `RidesRepository` (Task 3), `BookingsRepository` (existing), `NotificationsService` (existing)
- Produces: nightly cron that populates `rides` + `bookings` collections; cascade processor for cancelled trips

- [ ] **Step 1: Create the generator service**

Create `apps/backend/src/scheduler/recurring-ride-generator.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BookingStatus, NotificationType, PaymentStatus, RecurringSubscriptionStatus, RideStatus } from '@wasslni/shared-types';
import { RecurringTripsRepository } from '../recurring-trips/repositories/recurring-trips.repository';
import { RecurringSubscriptionsRepository } from '../recurring-subscriptions/repositories/recurring-subscriptions.repository';
import { RidesRepository } from '../rides/repositories/rides.repository';
import { BookingsRepository } from '../bookings/repositories/bookings.repository';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RecurringRideGeneratorService {
  private readonly logger = new Logger(RecurringRideGeneratorService.name);

  constructor(
    private readonly recurringTripsRepository: RecurringTripsRepository,
    private readonly subscriptionsRepository: RecurringSubscriptionsRepository,
    private readonly ridesRepository: RidesRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 2 * * *')
  async run() {
    this.logger.log('Recurring ride generator started');
    await this.processCancelledTrips();
    await this.generateUpcomingRides();
    this.logger.log('Recurring ride generator finished');
  }

  private async processCancelledTrips() {
    const cancelledTrips = await this.recurringTripsRepository.findCancelledUnprocessed();
    for (const trip of cancelledTrips) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const futureRides = await this.ridesRepository.findFutureByRecurringTrip(String(trip._id), today);

        for (const ride of futureRides) {
          await this.ridesRepository.updateById(String(ride._id), {
            status: RideStatus.Cancelled,
          } as Partial<import('../rides/schemas/ride.schema').Ride>);

          const bookings = await this.bookingsRepository.findByRide(String(ride._id));
          for (const booking of bookings) {
            if ([BookingStatus.Pending, BookingStatus.Accepted].includes(booking.status)) {
              await this.bookingsRepository.updateStatus(String(booking._id), BookingStatus.Cancelled);
            }
          }
        }

        const subscriptions = await this.subscriptionsRepository.findByRecurringTrip(String(trip._id));
        for (const sub of subscriptions) {
          if (sub.status !== RecurringSubscriptionStatus.Cancelled) {
            await this.subscriptionsRepository.updateById(String(sub._id), {
              status: RecurringSubscriptionStatus.Cancelled,
            } as Partial<import('../recurring-subscriptions/schemas/recurring-subscription.schema').RecurringSubscription>);

            await this.notificationsService.create(
              String(sub.passengerId),
              NotificationType.RecurringTripCancelled,
              'تم إلغاء الرحلة المتكررة',
              'أعلن السائق عن إلغاء رحلته المتكررة. تم إلغاء جميع حجوزاتك المستقبلية.',
              { recurringTripId: String(trip._id) },
            );
          }
        }

        await this.recurringTripsRepository.updateById(String(trip._id), {
          cascadeProcessedAt: new Date(),
        } as Partial<import('../recurring-trips/schemas/recurring-trip.schema').RecurringTrip>);

        this.logger.log(`Cascade processed for cancelled trip ${trip._id}`);
      } catch (err) {
        this.logger.error(`Failed cascade for trip ${trip._id}`, err);
      }
    }
  }

  private async generateUpcomingRides() {
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);

    const activeTrips = await this.recurringTripsRepository.findAllActive();

    for (const trip of activeTrips) {
      try {
        const dates = this.computeDates(trip.recurrence, trip.generatedUpTo, horizon);

        for (const dateStr of dates) {
          const existing = await this.ridesRepository.findByRecurringTripAndDate(String(trip._id), dateStr);
          if (existing) continue;

          const ride = await this.ridesRepository.create({
            driverId: trip.driverId,
            vehicleId: trip.vehicleId,
            departureCityId: trip.departureCityId,
            destinationCityId: trip.destinationCityId,
            departurePoint: trip.departurePoint,
            destinationPoint: trip.destinationPoint,
            date: dateStr,
            departureTime: trip.departureTime,
            price: trip.price,
            totalSeats: trip.totalSeats,
            availableSeats: trip.totalSeats,
            description: trip.description,
            status: RideStatus.Scheduled,
            recurringTripId: trip._id,
          } as Partial<import('../rides/schemas/ride.schema').Ride>);

          const subs = await this.subscriptionsRepository.findActiveByRecurringTrip(String(trip._id));
          const dayOfWeek = new Date(dateStr + 'T12:00:00Z').getUTCDay();

          for (const sub of subs) {
            if (sub.scheduleDays !== null && !sub.scheduleDays.includes(dayOfWeek)) continue;
            if (sub.skippedDates.includes(dateStr)) continue;

            const existingBooking = await this.bookingsRepository.findActiveByRideAndPassenger(
              String(ride._id),
              String(sub.passengerId),
            );
            if (existingBooking) continue;

            const freshRide = await this.ridesRepository.findById(String(ride._id));
            if (!freshRide || freshRide.availableSeats < sub.seats) {
              await this.notificationsService.create(
                String(sub.passengerId),
                NotificationType.RecurringSkipConfirmed,
                'لم يتوفر مقعد',
                `لم يتمكن النظام من حجز مقعدك ليوم ${dateStr} بسبب امتلاء الرحلة.`,
                { date: dateStr, recurringTripId: String(trip._id) },
              );
              continue;
            }

            await this.bookingsRepository.create({
              rideId: ride._id,
              passengerId: sub.passengerId,
              seats: sub.seats,
              status: BookingStatus.Accepted,
              paymentStatus: PaymentStatus.Pending,
            } as Partial<import('../bookings/schemas/booking.schema').Booking>);

            await this.ridesRepository.reserveSeats(String(ride._id), sub.seats);
          }
        }

        await this.recurringTripsRepository.updateGeneratedUpTo(String(trip._id), horizon);
        this.logger.log(`Generated rides for trip ${trip._id} up to ${horizon.toISOString().split('T')[0]}`);
      } catch (err) {
        this.logger.error(`Failed to generate rides for trip ${trip._id}`, err);
      }
    }
  }

  private computeDates(
    recurrence: { type: string; days: number[] },
    from: Date,
    to: Date,
  ): string[] {
    const dates: string[] = [];
    const current = new Date(from);
    current.setUTCDate(current.getUTCDate() + 1);

    while (current <= to) {
      const dayOfWeek = current.getUTCDay();
      const dateStr = current.toISOString().split('T')[0];

      if (recurrence.type === 'daily' || recurrence.days.length === 0) {
        dates.push(dateStr);
      } else if (recurrence.type === 'weekdays' && recurrence.days.includes(dayOfWeek)) {
        dates.push(dateStr);
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    return dates;
  }
}
```

- [ ] **Step 2: Create the scheduler module**

Create `apps/backend/src/scheduler/scheduler.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { RecurringRideGeneratorService } from './recurring-ride-generator.service';
import { RecurringTripsModule } from '../recurring-trips/recurring-trips.module';
import { RecurringSubscriptionsModule } from '../recurring-subscriptions/recurring-subscriptions.module';
import { RidesModule } from '../rides/rides.module';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    RecurringTripsModule,
    RecurringSubscriptionsModule,
    RidesModule,
    BookingsModule,
    NotificationsModule,
  ],
  providers: [RecurringRideGeneratorService],
})
export class SchedulerModule {}
```

- [ ] **Step 3: Register in AppModule**

Open `apps/backend/src/app.module.ts`. Add import:
```typescript
import { SchedulerModule } from './scheduler/scheduler.module';
```
Add `SchedulerModule` to the `imports` array.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Smoke test cron logic manually**

Add a temporary `GET /scheduler/run` endpoint to trigger generation during development. Or call the service method directly via NestJS REPL:

```bash
# From apps/backend/
node -e "
const { NestFactory } = require('@nestjs/core');
async function main() {
  const { AppModule } = require('./dist/app.module');
  const { RecurringRideGeneratorService } = require('./dist/scheduler/recurring-ride-generator.service');
  const app = await NestFactory.createApplicationContext(AppModule);
  const svc = app.get(RecurringRideGeneratorService);
  await svc.run();
  await app.close();
}
main().catch(console.error);
"
```

Expected: logs show `Recurring ride generator started` and `Recurring ride generator finished` with no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/scheduler/ apps/backend/src/app.module.ts
git commit -m "feat(scheduler): add nightly recurring ride generator with cascade processor"
```

---

### Task 7: Frontend API Modules

**Files:**
- Create: `apps/frontend/src/api/recurringTrips.ts`
- Create: `apps/frontend/src/api/recurringSubscriptions.ts`

**Interfaces:**
- Consumes: `apiClient` from `./client` (existing pattern)
- Produces: `recurringTripsApi`, `recurringSubscriptionsApi` — consumed by Tasks 8, 9, 10

- [ ] **Step 1: Create recurringTrips.ts**

Create `apps/frontend/src/api/recurringTrips.ts`:

```typescript
import apiClient from './client';
import type { RecurringSubscription, RecurringTrip } from '@wasslni/shared-types';

export type CreateRecurringTripPayload = {
  vehicleId: string;
  departureCityId: string;
  destinationCityId: string;
  departurePoint: string;
  destinationPoint?: string;
  departureTime: string;
  price: number;
  totalSeats: number;
  description?: string;
  recurrence: { type: 'daily' | 'weekdays'; days: number[] };
};

export const recurringTripsApi = {
  getMine: () => apiClient.get<RecurringTrip[]>('/recurring-trips/me'),
  create: (data: CreateRecurringTripPayload) => apiClient.post<RecurringTrip>('/recurring-trips', data),
  getOne: (id: string) => apiClient.get<RecurringTrip>(`/recurring-trips/${id}`),
  pause: (id: string) => apiClient.patch<RecurringTrip>(`/recurring-trips/${id}`, { status: 'paused' }),
  resume: (id: string) => apiClient.patch<RecurringTrip>(`/recurring-trips/${id}`, { status: 'active' }),
  cancel: (id: string) => apiClient.patch<RecurringTrip>(`/recurring-trips/${id}`, { status: 'cancelled' }),
  getSubscriptions: (id: string) => apiClient.get<RecurringSubscription[]>(`/recurring-trips/${id}/subscriptions`),
  subscribe: (id: string, seats: number, scheduleDays: number[] | null) =>
    apiClient.post<RecurringSubscription>(`/recurring-trips/${id}/subscribe`, { seats, scheduleDays }),
};
```

- [ ] **Step 2: Create recurringSubscriptions.ts**

Create `apps/frontend/src/api/recurringSubscriptions.ts`:

```typescript
import apiClient from './client';
import type { RecurringSubscription } from '@wasslni/shared-types';

export const recurringSubscriptionsApi = {
  getMine: () => apiClient.get<RecurringSubscription[]>('/recurring-subscriptions/me'),
  approve: (id: string) => apiClient.post<RecurringSubscription>(`/recurring-subscriptions/${id}/approve`),
  reject: (id: string) => apiClient.post<RecurringSubscription>(`/recurring-subscriptions/${id}/reject`),
  skip: (id: string, date: string) =>
    apiClient.post<RecurringSubscription>(`/recurring-subscriptions/${id}/skip`, { date }),
  unsubscribe: (id: string) => apiClient.delete(`/recurring-subscriptions/${id}`),
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/api/recurringTrips.ts apps/frontend/src/api/recurringSubscriptions.ts
git commit -m "feat(frontend): add recurring trips and subscriptions API modules"
```

---

### Task 8: Driver — Create Ride Form with Recurring Toggle

**Files:**
- Modify: `apps/frontend/src/pages/driver/CreateRidePage.tsx`
- Modify: `apps/frontend/src/i18n/locales/ar.json`

**Interfaces:**
- Consumes: `recurringTripsApi.create` (Task 7), `ridesApi.create` (existing)
- Produces: driver can toggle between one-off and recurring trip creation

- [ ] **Step 1: Add i18n keys for recurring trip creation**

Open `apps/frontend/src/i18n/locales/ar.json`. Add a new `"recurring"` section:

```json
"recurring": {
  "toggle": "رحلة يومية متكررة؟",
  "recurrenceType": "نوع التكرار",
  "daily": "كل يوم",
  "weekdays": "أيام محددة",
  "selectDays": "اختر الأيام",
  "days": {
    "0": "الأحد",
    "1": "الاثنين",
    "2": "الثلاثاء",
    "3": "الأربعاء",
    "4": "الخميس",
    "5": "الجمعة",
    "6": "السبت"
  },
  "createSuccess": "تم إنشاء الرحلة المتكررة بنجاح",
  "myTrips": "رحلاتي المتكررة",
  "noTrips": "لا توجد رحلات متكررة",
  "subscriberCount": "{{count}} مشترك",
  "status": {
    "active": "نشطة",
    "paused": "متوقفة",
    "cancelled": "ملغاة"
  },
  "pause": "إيقاف مؤقت",
  "resume": "استئناف",
  "cancelSeries": "إلغاء الرحلة المتكررة",
  "viewSubscribers": "عرض المشتركين",
  "pendingSubscribers": "طلبات الاشتراك ({{count}})",
  "subscribe": "اشترك في هذه الرحلة",
  "subscribeModal": "تفاصيل الاشتراك",
  "scheduleType": "أيام الاشتراك",
  "allDays": "كل أيام الرحلة",
  "chosenDays": "أيام محددة",
  "mySubscriptions": "اشتراكاتي",
  "skipDay": "تخطي هذا اليوم",
  "unsubscribe": "إلغاء الاشتراك",
  "subscriptionStatus": {
    "pending": "بانتظار موافقة السائق",
    "active": "نشط",
    "cancelled": "ملغى"
  },
  "approveSubscription": "قبول",
  "rejectSubscription": "رفض",
  "badge": "رحلة متكررة"
}
```

- [ ] **Step 2: Rewrite CreateRidePage.tsx with recurring toggle**

Replace the entire content of `apps/frontend/src/pages/driver/CreateRidePage.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@wasslni/shared-ui';
import { CitySelect } from '@/components/CitySelect';
import { Input, Card, Alert, Select } from '@/components/ui';
import { useCities } from '@/hooks/useCities';
import { vehiclesApi } from '@/api/vehicles';
import { ridesApi } from '@/api/rides';
import { recurringTripsApi } from '@/api/recurringTrips';

const baseSchema = {
  vehicleId: z.string().min(1),
  departureCityId: z.string().min(1),
  destinationCityId: z.string().min(1),
  departurePoint: z.string().min(2),
  departureTime: z.string().min(1),
  price: z.number().min(1),
  totalSeats: z.number().min(1).max(8),
  description: z.string().optional(),
};

const oneOffSchema = z.object({ ...baseSchema, date: z.string().min(1) });
const recurringSchema = z.object({
  ...baseSchema,
  recurrenceType: z.enum(['daily', 'weekdays']),
  recurrenceDays: z.array(z.number()).optional(),
});

type OneOffForm = z.infer<typeof oneOffSchema>;
type RecurringForm = z.infer<typeof recurringSchema>;

const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6] as const;

export function CreateRidePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRecurring, setIsRecurring] = useState(false);
  const { data: cities = [] } = useCities();
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', 'mine'],
    queryFn: () => vehiclesApi.getMine().then((r) => r.data),
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const oneOffForm = useForm<OneOffForm>({
    resolver: zodResolver(oneOffSchema),
    defaultValues: {
      vehicleId: '',
      departureCityId: '',
      destinationCityId: '',
      date: tomorrow.toISOString().split('T')[0],
      departureTime: '08:00',
      totalSeats: 3,
    },
  });

  const recurringForm = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      vehicleId: '',
      departureCityId: '',
      destinationCityId: '',
      departureTime: '08:00',
      totalSeats: 3,
      recurrenceType: 'daily',
      recurrenceDays: [],
    },
  });

  const oneOffMutation = useMutation({
    mutationFn: ridesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      navigate('/app/my-rides');
    },
    onError: () => oneOffForm.setError('root', { message: t('common.error') }),
  });

  const recurringMutation = useMutation({
    mutationFn: recurringTripsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-trips', 'mine'] });
      navigate('/app/my-rides');
    },
    onError: () => recurringForm.setError('root', { message: t('common.error') }),
  });

  const recurrenceType = recurringForm.watch('recurrenceType');
  const recurrenceDays = recurringForm.watch('recurrenceDays') ?? [];

  const toggleDay = (day: number) => {
    const current = recurrenceDays;
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    recurringForm.setValue('recurrenceDays', next);
  };

  const submitRecurring = (data: RecurringForm) => {
    recurringMutation.mutate({
      vehicleId: data.vehicleId,
      departureCityId: data.departureCityId,
      destinationCityId: data.destinationCityId,
      departurePoint: data.departurePoint,
      departureTime: data.departureTime,
      price: data.price,
      totalSeats: data.totalSeats,
      description: data.description,
      recurrence: {
        type: data.recurrenceType,
        days: data.recurrenceType === 'daily' ? [] : (data.recurrenceDays ?? []),
      },
    });
  };

  if (vehicles.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <h2 className="text-xl font-semibold">{t('user.createRide')}</h2>
        <Alert variant="info">{t('driver.noVehiclesHint')}</Alert>
        <Button onClick={() => navigate('/app/vehicles')}>{t('user.addVehicle')}</Button>
      </div>
    );
  }

  const sharedFields = (
    form: typeof oneOffForm | typeof recurringForm,
    errors: typeof oneOffForm.formState.errors | typeof recurringForm.formState.errors,
  ) => (
    <>
      <Select
        label={t('driver.selectVehicle')}
        error={(errors as OneOffForm & { vehicleId?: { message?: string } }).vehicleId?.message}
        {...form.register('vehicleId')}
      >
        <option value="">{t('driver.selectVehicle')}</option>
        {vehicles.map((v) => (
          <option key={v._id} value={v._id}>
            {v.brand} {v.vehicleModel} · {v.licensePlate}
          </option>
        ))}
      </Select>

      <Controller
        name="departureCityId"
        control={form.control}
        render={({ field }) => (
          <CitySelect
            name="departureCityId"
            cities={cities}
            label={t('search.from')}
            placeholder={t('search.selectCity')}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        name="destinationCityId"
        control={form.control}
        render={({ field }) => (
          <CitySelect
            name="destinationCityId"
            cities={cities}
            label={t('search.to')}
            placeholder={t('search.selectCity')}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <Input label={t('ride.departure')} {...form.register('departurePoint')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input type="time" label={t('ride.time')} {...form.register('departureTime')} />
        <Input
          type="number"
          label={t('ride.price')}
          {...form.register('price', { valueAsNumber: true })}
        />
      </div>
      <Input
        type="number"
        label={t('ride.seats')}
        {...form.register('totalSeats', { valueAsNumber: true })}
      />
      <Input label={t('ride.description')} {...form.register('description')} />
    </>
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h2 className="text-xl font-semibold">{t('user.createRide')}</h2>

      <Card>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
          <span className="font-medium">{t('recurring.toggle')}</span>
        </label>
      </Card>

      {!isRecurring ? (
        <Card>
          <form
            onSubmit={oneOffForm.handleSubmit((d) => oneOffMutation.mutate(d))}
            className="space-y-4"
          >
            {oneOffMutation.isError && <Alert variant="error">{t('common.error')}</Alert>}
            {sharedFields(oneOffForm, oneOffForm.formState.errors)}
            <Input
              type="date"
              label={t('search.date')}
              error={oneOffForm.formState.errors.date?.message}
              {...oneOffForm.register('date')}
            />
            <Button type="submit" disabled={oneOffMutation.isPending} className="w-full py-3">
              {t('common.save')}
            </Button>
          </form>
        </Card>
      ) : (
        <Card>
          <form onSubmit={recurringForm.handleSubmit(submitRecurring)} className="space-y-4">
            {recurringMutation.isError && <Alert variant="error">{t('common.error')}</Alert>}
            {sharedFields(recurringForm, recurringForm.formState.errors)}

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">{t('recurring.recurrenceType')}</p>
              <div className="flex gap-4">
                {(['daily', 'weekdays'] as const).map((type) => (
                  <label key={type} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      value={type}
                      {...recurringForm.register('recurrenceType')}
                    />
                    <span className="text-sm">{t(`recurring.${type}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {recurrenceType === 'weekdays' && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">{t('recurring.selectDays')}</p>
                <div className="flex flex-wrap gap-2">
                  {DAY_INDICES.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        recurrenceDays.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t(`recurring.days.${day}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" disabled={recurringMutation.isPending} className="w-full py-3">
              {t('common.save')}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Restart frontend and test in browser**

```bash
docker restart wasslni-frontend
```

Open `http://localhost/app/create-ride`. Verify:
- Checkbox toggles between one-off and recurring forms
- Recurring form shows recurrence type radio buttons
- Selecting "أيام محددة" reveals day picker buttons
- Submitting recurring form POSTs to `/recurring-trips`

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/pages/driver/CreateRidePage.tsx apps/frontend/src/i18n/locales/ar.json
git commit -m "feat(driver): add recurring trip toggle and day picker to Create Ride form"
```

---

### Task 9: Driver — My Rides Page with Recurring Trips Section

**Files:**
- Modify: `apps/frontend/src/pages/driver/MyRidesPage.tsx`

**Interfaces:**
- Consumes: `recurringTripsApi` (Task 7), `recurringSubscriptionsApi` (Task 7)
- Produces: driver sees "رحلاتي المتكررة" section with pause/cancel actions and subscriber approval

- [ ] **Step 1: Rewrite MyRidesPage.tsx to add recurring section**

Replace the entire content of `apps/frontend/src/pages/driver/MyRidesPage.tsx`:

```typescript
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@wasslni/shared-ui';
import { RideCard } from '@/components/RideCard';
import { EmptyState } from '@/components/EmptyState';
import { Card, Spinner, Badge } from '@/components/ui';
import { ridesApi } from '@/api/rides';
import { recurringTripsApi } from '@/api/recurringTrips';
import { recurringSubscriptionsApi } from '@/api/recurringSubscriptions';
import { DEMO_RIDES } from '@/data/demo';
import type { RideWithDetails } from '@/data/demo';
import type { RecurringSubscription, RecurringTrip } from '@wasslni/shared-types';
import { RecurringSubscriptionStatus, RecurringTripStatus } from '@wasslni/shared-types';

type Tab = 'rides' | 'recurring';

const statusVariant = (s: RecurringTripStatus): 'success' | 'warning' | 'danger' | 'default' =>
  s === RecurringTripStatus.Active
    ? 'success'
    : s === RecurringTripStatus.Paused
    ? 'warning'
    : 'danger';

function RecurringTripCard({ trip }: { trip: RecurringTrip }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showSubs, setShowSubs] = useState(false);

  const { data: subscriptions = [] } = useQuery<RecurringSubscription[]>({
    queryKey: ['recurring-subscriptions', trip._id],
    queryFn: () => recurringTripsApi.getSubscriptions(trip._id).then((r) => r.data),
    enabled: showSubs,
  });

  const pauseMutation = useMutation({
    mutationFn: () => recurringTripsApi.pause(trip._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-trips', 'mine'] }),
  });
  const resumeMutation = useMutation({
    mutationFn: () => recurringTripsApi.resume(trip._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-trips', 'mine'] }),
  });
  const cancelMutation = useMutation({
    mutationFn: () => recurringTripsApi.cancel(trip._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-trips', 'mine'] }),
  });
  const approveMutation = useMutation({
    mutationFn: recurringSubscriptionsApi.approve,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-subscriptions', trip._id] }),
  });
  const rejectMutation = useMutation({
    mutationFn: recurringSubscriptionsApi.reject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-subscriptions', trip._id] }),
  });

  const pending = subscriptions.filter((s) => s.status === RecurringSubscriptionStatus.Pending);
  const active = subscriptions.filter((s) => s.status === RecurringSubscriptionStatus.Active);

  const recurrenceLabel =
    trip.recurrence.type === 'daily'
      ? t('recurring.daily')
      : trip.recurrence.days
          .sort()
          .map((d) => t(`recurring.days.${d}`))
          .join('، ');

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(trip.status as RecurringTripStatus)}>
                {t(`recurring.status.${trip.status}`)}
              </Badge>
              <span className="text-xs text-slate-500">🔁 {recurrenceLabel}</span>
            </div>
            <h3 className="mt-1 font-semibold">
              {trip.departureCityId} → {trip.destinationCityId}
            </h3>
            <p className="text-sm text-slate-500">
              {trip.departureTime} · {trip.price} ل.س · {trip.totalSeats} {t('ride.seats')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t('recurring.subscriberCount', { count: active.length })}
              {pending.length > 0 && (
                <span className="ms-2 text-amber-600">
                  ({t('recurring.pendingSubscribers', { count: pending.length })})
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            {trip.status === RecurringTripStatus.Active && (
              <Button
                variant="ghost"
                onClick={() => pauseMutation.mutate()}
                disabled={pauseMutation.isPending}
              >
                {t('recurring.pause')}
              </Button>
            )}
            {trip.status === RecurringTripStatus.Paused && (
              <Button
                variant="secondary"
                onClick={() => resumeMutation.mutate()}
                disabled={resumeMutation.isPending}
              >
                {t('recurring.resume')}
              </Button>
            )}
            {trip.status !== RecurringTripStatus.Cancelled && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm(t('recurring.cancelSeries') + '?')) cancelMutation.mutate();
                }}
                disabled={cancelMutation.isPending}
              >
                {t('recurring.cancelSeries')}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowSubs((v) => !v)}>
              {t('recurring.viewSubscribers')}
            </Button>
          </div>
        </div>

        {showSubs && (
          <div className="border-t pt-3 space-y-2">
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-700 mb-2">
                  {t('recurring.pendingSubscribers', { count: pending.length })}
                </p>
                {pending.map((sub) => (
                  <div key={sub._id} className="flex items-center justify-between rounded bg-amber-50 px-3 py-2">
                    <div>
                      <p className="text-sm">{sub.passengerId}</p>
                      <p className="text-xs text-slate-500">
                        {sub.seats} {t('ride.seats')} ·{' '}
                        {sub.scheduleDays === null
                          ? t('recurring.allDays')
                          : sub.scheduleDays.map((d) => t(`recurring.days.${d}`)).join('، ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => approveMutation.mutate(sub._id)}
                        disabled={approveMutation.isPending}
                      >
                        {t('recurring.approveSubscription')}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => rejectMutation.mutate(sub._id)}
                        disabled={rejectMutation.isPending}
                      >
                        {t('recurring.rejectSubscription')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {active.length === 0 && pending.length === 0 && (
              <p className="text-sm text-slate-400">{t('recurring.noTrips')}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export function MyRidesPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('rides');

  const { data: rides = [], isLoading: ridesLoading } = useQuery({
    queryKey: ['rides', 'mine'],
    queryFn: async () => {
      try {
        const { data } = await ridesApi.getMine();
        return data.length > 0 ? (data as RideWithDetails[]) : (DEMO_RIDES.slice(0, 2) as RideWithDetails[]);
      } catch {
        return DEMO_RIDES.slice(0, 2) as RideWithDetails[];
      }
    },
  });

  const { data: recurringTrips = [], isLoading: recurringLoading } = useQuery<RecurringTrip[]>({
    queryKey: ['recurring-trips', 'mine'],
    queryFn: () => recurringTripsApi.getMine().then((r) => r.data),
    enabled: tab === 'recurring',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('driver.myRides')}</h2>
        <Link to="/app/create-ride">
          <Button>{t('driver.createRide')}</Button>
        </Link>
      </div>

      <div className="flex gap-2 border-b">
        {(['rides', 'recurring'] as Tab[]).map((t_) => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t_
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t_ === 'rides' ? t('driver.myRides') : t('recurring.myTrips')}
          </button>
        ))}
      </div>

      {tab === 'rides' && (
        ridesLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : rides.length === 0 ? (
          <EmptyState
            title={t('driver.noRides')}
            description={t('driver.createFirst')}
            actionLabel={t('driver.createRide')}
            actionTo="/app/create-ride"
          />
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => <RideCard key={ride._id} ride={ride} />)}
          </div>
        )
      )}

      {tab === 'recurring' && (
        recurringLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : recurringTrips.length === 0 ? (
          <EmptyState
            title={t('recurring.noTrips')}
            description={t('driver.createFirst')}
            actionLabel={t('driver.createRide')}
            actionTo="/app/create-ride"
          />
        ) : (
          <div className="space-y-4">
            {recurringTrips.map((trip) => (
              <RecurringTripCard key={trip._id} trip={trip} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Restart frontend and test**

```bash
docker restart wasslni-frontend
```

Open `http://localhost/app/my-rides`. Verify:
- Two tabs appear: "رحلاتي" and "رحلاتي المتكررة"
- Recurring tab shows cards for any recurring trips
- Each card shows pause/cancel/viewSubscribers buttons
- Pending subscribers show approve/reject buttons

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/pages/driver/MyRidesPage.tsx
git commit -m "feat(driver): add recurring trips tab with subscriber management to My Rides page"
```

---

### Task 10: Passenger — Subscribe Modal and Recurring Bookings View

**Files:**
- Modify: `apps/frontend/src/pages/passenger/BookingsPage.tsx`

**Interfaces:**
- Consumes: `recurringSubscriptionsApi` (Task 7), existing `useBookingsStore`
- Produces: passenger sees recurring subscriptions with skip/unsubscribe controls

- [ ] **Step 1: Rewrite BookingsPage.tsx with recurring subscriptions section**

Replace the entire content of `apps/frontend/src/pages/passenger/BookingsPage.tsx`:

```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingStatus, RecurringSubscriptionStatus } from '@wasslni/shared-types';
import type { RecurringSubscription } from '@wasslni/shared-types';
import { useBookingsStore } from '@/store/bookings.store';
import { formatDate, formatPrice } from '@/utils/format';
import { Card, Badge } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@wasslni/shared-ui';
import { recurringSubscriptionsApi } from '@/api/recurringSubscriptions';

const statusVariant: Record<BookingStatus, 'warning' | 'success' | 'danger' | 'default'> = {
  [BookingStatus.Pending]: 'warning',
  [BookingStatus.Accepted]: 'success',
  [BookingStatus.Rejected]: 'danger',
  [BookingStatus.Cancelled]: 'default',
};

const subStatusVariant = (s: RecurringSubscriptionStatus): 'warning' | 'success' | 'danger' | 'default' =>
  s === RecurringSubscriptionStatus.Active
    ? 'success'
    : s === RecurringSubscriptionStatus.Pending
    ? 'warning'
    : 'default';

function SkipDateModal({
  subscriptionId,
  onClose,
}: {
  subscriptionId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');

  const skipMutation = useMutation({
    mutationFn: () => recurringSubscriptionsApi.skip(subscriptionId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-subscriptions', 'mine'] });
      onClose();
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-sm mx-4">
        <h3 className="font-semibold mb-4">{t('recurring.skipDay')}</h3>
        <input
          type="date"
          min={minDate}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm mb-4"
        />
        <div className="flex gap-2">
          <Button
            onClick={() => skipMutation.mutate()}
            disabled={!date || skipMutation.isPending}
            className="flex-1"
          >
            {t('recurring.skipDay')}
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function BookingsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const bookings = useBookingsStore((s) => s.bookings);
  const cancelBooking = useBookingsStore((s) => s.cancelBooking);
  const [skipModalSubId, setSkipModalSubId] = useState<string | null>(null);

  const { data: subscriptions = [] } = useQuery<RecurringSubscription[]>({
    queryKey: ['recurring-subscriptions', 'mine'],
    queryFn: () => recurringSubscriptionsApi.getMine().then((r) => r.data),
  });

  const unsubscribeMutation = useMutation({
    mutationFn: recurringSubscriptionsApi.unsubscribe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-subscriptions', 'mine'] }),
  });

  const activeBookings = bookings.filter((b) => b.status !== BookingStatus.Cancelled);
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status !== RecurringSubscriptionStatus.Cancelled,
  );

  if (activeBookings.length === 0 && activeSubscriptions.length === 0) {
    return (
      <EmptyState
        title={t('booking.empty')}
        description={t('booking.emptyHint')}
        actionLabel={t('nav.search')}
        actionTo="/search"
      />
    );
  }

  return (
    <div className="space-y-6">
      {skipModalSubId && (
        <SkipDateModal subscriptionId={skipModalSubId} onClose={() => setSkipModalSubId(null)} />
      )}

      {activeBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('booking.title')}</h2>
          {activeBookings.map((booking) => (
            <Card key={booking.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge variant={statusVariant[booking.status]}>
                    {t(`booking.status.${booking.status}`)}
                  </Badge>
                  <h3 className="mt-2 font-semibold text-slate-900">
                    {booking.ride.departureCityName} → {booking.ride.destinationCityName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(booking.ride.date, i18n.language)} · {booking.ride.departureTime}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t('booking.seats', { count: booking.seats })} ·{' '}
                    {formatPrice(booking.ride.price * booking.seats, i18n.language)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/rides/${booking.rideId}`}>
                    <Button variant="secondary">{t('ride.viewDetails')}</Button>
                  </Link>
                  {booking.status === BookingStatus.Pending && (
                    <Button variant="ghost" onClick={() => cancelBooking(booking.id)}>
                      {t('booking.cancel')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('recurring.mySubscriptions')}</h2>
          {activeSubscriptions.map((sub) => (
            <Card key={sub._id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={subStatusVariant(sub.status as RecurringSubscriptionStatus)}>
                      {t(`recurring.subscriptionStatus.${sub.status}`)}
                    </Badge>
                    <span className="text-xs text-slate-400">🔁 {t('recurring.badge')}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {sub.seats} {t('ride.seats')} ·{' '}
                    {sub.scheduleDays === null
                      ? t('recurring.allDays')
                      : sub.scheduleDays.map((d) => t(`recurring.days.${d}`)).join('، ')}
                  </p>
                  {sub.skippedDates.length > 0 && (
                    <p className="text-xs text-slate-400">
                      {sub.skippedDates.length} أيام متخطاة
                    </p>
                  )}
                </div>
                {sub.status === RecurringSubscriptionStatus.Active && (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setSkipModalSubId(sub._id)}>
                      {t('recurring.skipDay')}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (confirm(t('recurring.unsubscribe') + '?')) {
                          unsubscribeMutation.mutate(sub._id);
                        }
                      }}
                      disabled={unsubscribeMutation.isPending}
                    >
                      {t('recurring.unsubscribe')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Build frontend**

```bash
docker exec wasslni-frontend npm run build 2>&1 | tail -5
```

Expected: `built in Xs` with no errors.

- [ ] **Step 4: Restart and test in browser**

```bash
docker restart wasslni-frontend
```

Open `http://localhost/app/bookings`. Verify:
- One-off bookings section renders as before
- Recurring subscriptions section appears below with badge "🔁 رحلة متكررة"
- Status badge shows pending/active correctly
- "تخطي هذا اليوم" opens the date-picker modal
- "إلغاء الاشتراك" triggers confirm then calls DELETE endpoint

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/pages/passenger/BookingsPage.tsx
git commit -m "feat(passenger): add recurring subscriptions section with skip and unsubscribe to Bookings page"
```

---

## End-to-End Verification

After all tasks complete, run this manual flow:

1. **Driver**: Log in as driver → Create Ride → toggle recurring → select "أيام محددة" → pick Mon/Wed/Fri → submit
2. **Verify**: `GET /recurring-trips/me` returns the new trip with `status: 'active'`
3. **Passenger**: Log in as passenger → open `GET /recurring-trips/:id` → call `POST /recurring-trips/:id/subscribe` with `{ seats: 1, scheduleDays: null }`
4. **Driver**: call `POST /recurring-subscriptions/:id/approve`
5. **Trigger cron manually** (see Task 6 Step 5) → verify rides are created in DB for next 30 Mon/Wed/Fri dates and bookings with `status: 'Accepted'` exist for the passenger
6. **Passenger**: `GET /recurring-subscriptions/me` → call `POST /recurring-subscriptions/:id/skip` with a future Wednesday date → verify the booking for that date is `Cancelled`
7. **Passenger**: `DELETE /recurring-subscriptions/:id` → verify all future accepted bookings are cancelled
8. **Driver**: `PATCH /recurring-trips/:id` with `{ status: 'cancelled' }` → on next cron run, verify cascade marks `cascadeProcessedAt` and notifies passengers
