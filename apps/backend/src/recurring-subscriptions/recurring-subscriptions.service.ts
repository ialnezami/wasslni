import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, NotificationType, PaymentStatus, RecurringSubscriptionStatus, RecurringTripStatus } from '@wasslni/shared-types';
import { RecurringSubscriptionsRepository } from './repositories/recurring-subscriptions.repository';
import { RecurringTripsRepository } from '../recurring-trips/repositories/recurring-trips.repository';
import { RidesRepository } from '../rides/repositories/rides.repository';
import { BookingsRepository } from '../bookings/repositories/bookings.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSubscriptionDto, SkipDateDto } from './dto/recurring-subscriptions.dto';
import type { RecurringSubscription } from './schemas/recurring-subscription.schema';

@Injectable()
export class RecurringSubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: RecurringSubscriptionsRepository,
    private readonly recurringTripsRepository: RecurringTripsRepository,
    private readonly ridesRepository: RidesRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  findMine(passengerId: string) { return this.subscriptionsRepository.findByPassenger(passengerId); }

  findByTrip(recurringTripId: string) { return this.subscriptionsRepository.findByRecurringTrip(recurringTripId); }

  async subscribe(recurringTripId: string, passengerId: string, dto: CreateSubscriptionDto) {
    const trip = await this.recurringTripsRepository.findById(recurringTripId);
    if (!trip) throw new NotFoundException('Recurring trip not found');
    if (trip.status !== RecurringTripStatus.Active) throw new BadRequestException('Trip is not accepting subscriptions');
    if (dto.seats > trip.totalSeats) throw new BadRequestException('Requested seats exceed trip capacity');
    const existing = await this.subscriptionsRepository.findByTripAndPassenger(recurringTripId, passengerId);
    if (existing && existing.status !== RecurringSubscriptionStatus.Cancelled) throw new ConflictException('Already subscribed to this trip');
    const subscription = await this.subscriptionsRepository.create({
      recurringTripId: recurringTripId as never, passengerId: passengerId as never,
      seats: dto.seats, status: RecurringSubscriptionStatus.Pending,
      scheduleDays: dto.scheduleDays ?? null, skippedDates: [],
    } as Partial<RecurringSubscription>);
    await this.notificationsService.create(String(trip.driverId), NotificationType.RecurringSubscriptionReceived, 'طلب اشتراك جديد', 'راكب جديد يريد الانضمام لرحلتك اليومية', { subscriptionId: String(subscription._id), recurringTripId });
    return subscription;
  }

  async approve(subscriptionId: string, driverId: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status !== RecurringSubscriptionStatus.Pending) throw new BadRequestException('Subscription is not pending');
    const trip = await this.recurringTripsRepository.findById(String(sub.recurringTripId));
    if (!trip || String(trip.driverId) !== driverId) throw new ForbiddenException('You do not own this trip');
    await this.subscriptionsRepository.updateById(subscriptionId, { status: RecurringSubscriptionStatus.Active } as Partial<RecurringSubscription>);
    await this.notificationsService.create(String(sub.passengerId), NotificationType.RecurringSubscriptionApproved, 'تم قبول اشتراكك', 'وافق السائق على اشتراكك في رحلته اليومية. ستُحجز لك مقاعد تلقائياً.', { subscriptionId, recurringTripId: String(sub.recurringTripId) });
    return this.subscriptionsRepository.findById(subscriptionId);
  }

  async reject(subscriptionId: string, driverId: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status !== RecurringSubscriptionStatus.Pending) throw new BadRequestException('Subscription is not pending');
    const trip = await this.recurringTripsRepository.findById(String(sub.recurringTripId));
    if (!trip || String(trip.driverId) !== driverId) throw new ForbiddenException('You do not own this trip');
    await this.subscriptionsRepository.updateById(subscriptionId, { status: RecurringSubscriptionStatus.Cancelled } as Partial<RecurringSubscription>);
    await this.notificationsService.create(String(sub.passengerId), NotificationType.RecurringSubscriptionRejected, 'تم رفض اشتراكك', 'رفض السائق طلب اشتراكك في رحلته اليومية.', { subscriptionId, recurringTripId: String(sub.recurringTripId) });
    return this.subscriptionsRepository.findById(subscriptionId);
  }

  async skipDate(subscriptionId: string, passengerId: string, dto: SkipDateDto) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');
    if (String(sub.passengerId) !== passengerId) throw new ForbiddenException('You do not own this subscription');
    if (sub.status !== RecurringSubscriptionStatus.Active) throw new BadRequestException('Subscription is not active');
    const today = new Date().toISOString().split('T')[0];
    if (dto.date <= today) throw new BadRequestException('Can only skip future dates');
    if (sub.skippedDates.includes(dto.date)) throw new ConflictException('Date already skipped');
    await this.subscriptionsRepository.addSkippedDate(subscriptionId, dto.date);
    const ride = await this.ridesRepository.findByRecurringTripAndDate(String(sub.recurringTripId), dto.date);
    if (ride) {
      const booking = await this.bookingsRepository.findActiveByRideAndPassenger(String(ride._id), passengerId);
      if (booking && [BookingStatus.Pending, BookingStatus.Accepted].includes(booking.status)) {
        await this.bookingsRepository.updateStatus(String(booking._id), BookingStatus.Cancelled);
        await this.ridesRepository.releaseSeats(String(ride._id), sub.seats);
      }
    }
    await this.notificationsService.create(passengerId, NotificationType.RecurringSkipConfirmed, 'تم تخطي اليوم', `تم إلغاء حجزك ليوم ${dto.date} بنجاح.`, { subscriptionId, date: dto.date });
    return this.subscriptionsRepository.findById(subscriptionId);
  }

  async unsubscribe(subscriptionId: string, passengerId: string) {
    const sub = await this.subscriptionsRepository.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');
    if (String(sub.passengerId) !== passengerId) throw new ForbiddenException('You do not own this subscription');
    if (sub.status === RecurringSubscriptionStatus.Cancelled) throw new BadRequestException('Already unsubscribed');
    await this.subscriptionsRepository.updateById(subscriptionId, { status: RecurringSubscriptionStatus.Cancelled } as Partial<RecurringSubscription>);
    const today = new Date().toISOString().split('T')[0];
    const futureRides = await this.ridesRepository.findFutureByRecurringTrip(String(sub.recurringTripId), today);
    for (const ride of futureRides) {
      const booking = await this.bookingsRepository.findActiveByRideAndPassenger(String(ride._id), passengerId);
      if (booking) {
        await this.bookingsRepository.updateStatus(String(booking._id), BookingStatus.Cancelled);
        await this.ridesRepository.releaseSeats(String(ride._id), sub.seats);
      }
    }
    return { message: 'Unsubscribed successfully' };
  }
}
