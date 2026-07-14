import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  BookingStatus,
  NotificationType,
  PaymentStatus,
  RecurringSubscriptionStatus,
  RideStatus,
} from '@wasslni/shared-types';
import { RecurringTripsRepository } from '../recurring-trips/repositories/recurring-trips.repository';
import { RecurringSubscriptionsRepository } from '../recurring-subscriptions/repositories/recurring-subscriptions.repository';
import { RidesRepository } from '../rides/repositories/rides.repository';
import { BookingsRepository } from '../bookings/repositories/bookings.repository';
import { NotificationsService } from '../notifications/notifications.service';
import type { RecurringTrip } from '../recurring-trips/schemas/recurring-trip.schema';
import type { Ride } from '../rides/schemas/ride.schema';
import type { Booking } from '../bookings/schemas/booking.schema';

@Injectable()
export class RecurringRideGeneratorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RecurringRideGeneratorService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly recurringTripsRepository: RecurringTripsRepository,
    private readonly subscriptionsRepository: RecurringSubscriptionsRepository,
    private readonly ridesRepository: RidesRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  onApplicationBootstrap() {
    this.scheduleNextRun();
  }

  private scheduleNextRun() {
    const now = new Date();
    const next2am = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 2, 0, 0, 0));
    if (next2am <= now) {
      next2am.setUTCDate(next2am.getUTCDate() + 1);
    }
    const delay = next2am.getTime() - now.getTime();
    this.logger.log(`Next ride generation scheduled at ${next2am.toISOString()} (in ${Math.round(delay / 60000)}m)`);
    this.timer = setTimeout(async () => {
      await this.run();
      this.scheduleNextRun();
    }, delay);
  }

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
          } as Partial<Ride>);

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
              'أوقف السائق الرحلة المتكررة. تم إلغاء جميع الحجوزات المستقبلية.',
              { recurringTripId: String(trip._id) },
            );
          }
        }

        await this.recurringTripsRepository.updateById(String(trip._id), {
          cascadeProcessedAt: new Date(),
        } as Partial<RecurringTrip>);

        this.logger.log(`Cascade processed for cancelled trip ${trip._id}`);
      } catch (err) {
        this.logger.error(`Failed cascade for trip ${trip._id}`, err);
      }
    }
  }

  private async generateUpcomingRides() {
    const horizon = new Date();
    horizon.setUTCDate(horizon.getUTCDate() + 30);

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
          } as Partial<Ride>);

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
            } as Partial<Booking>);

            await this.ridesRepository.reserveSeats(String(ride._id), sub.seats);
          }
        }

        if (dates.length > 0) {
          await this.recurringTripsRepository.updateGeneratedUpTo(String(trip._id), horizon);
        }
      } catch (err) {
        this.logger.error(`Failed to generate rides for trip ${trip._id}`, err);
      }
    }
  }

  private computeDates(
    recurrence: { type: 'daily' | 'weekdays'; days: number[] },
    generatedUpTo: Date | string,
    horizon: Date,
  ): string[] {
    const dates: string[] = [];
    const upToStr = generatedUpTo instanceof Date
      ? generatedUpTo.toISOString().split('T')[0]
      : generatedUpTo;
    const current = new Date(upToStr + 'T12:00:00Z');
    current.setUTCDate(current.getUTCDate() + 1);

    while (current <= horizon) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getUTCDay();

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
