import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Ride, RideSchema } from '../rides/schemas/ride.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Report, ReportSchema } from '../reports/schemas/report.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: User.name, schema: UserSchema },
    { name: Ride.name, schema: RideSchema },
    { name: Booking.name, schema: BookingSchema },
    { name: Report.name, schema: ReportSchema },
    { name: Review.name, schema: ReviewSchema },
  ])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
