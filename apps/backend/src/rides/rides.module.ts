import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { RidesRepository } from './repositories/rides.repository';
import { Ride, RideSchema } from './schemas/ride.schema';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Ride.name, schema: RideSchema }]), VehiclesModule],
  controllers: [RidesController],
  providers: [RidesService, RidesRepository],
  exports: [RidesService, RidesRepository],
})
export class RidesModule {}
