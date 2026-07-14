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
    MongooseModule.forFeature([{ name: RecurringSubscription.name, schema: RecurringSubscriptionSchema }]),
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
