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
