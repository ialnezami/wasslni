import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RidesModule } from './rides/rides.module';
import { BookingsModule } from './bookings/bookings.module';
import { CitiesModule } from './cities/cities.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { RecurringTripsModule } from './recurring-trips/recurring-trips.module';
import { RecurringSubscriptionsModule } from './recurring-subscriptions/recurring-subscriptions.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    RidesModule,
    BookingsModule,
    CitiesModule,
    VehiclesModule,
    ReviewsModule,
    ReportsModule,
    NotificationsModule,
    AdminModule,
    RecurringTripsModule,
    RecurringSubscriptionsModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
