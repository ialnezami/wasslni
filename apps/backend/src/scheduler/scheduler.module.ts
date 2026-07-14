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
