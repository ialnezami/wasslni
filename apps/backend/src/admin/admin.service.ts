import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRole } from '@wasslni/shared-types';
import { User } from '../users/schemas/user.schema';
import { Ride } from '../rides/schemas/ride.schema';
import { Booking } from '../bookings/schemas/booking.schema';
import { Report } from '../reports/schemas/report.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Ride.name) private readonly rideModel: Model<Ride>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<Booking>,
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
  ) {}

  async getDashboardStats() {
    const active = { deletedAt: null };
    const [users, drivers, passengers, rides, bookings, reports] = await Promise.all([
      this.userModel.countDocuments(active),
      this.userModel.countDocuments({ ...active, role: UserRole.Driver }),
      this.userModel.countDocuments({ ...active, role: UserRole.Passenger }),
      this.rideModel.countDocuments(active),
      this.bookingModel.countDocuments(active),
      this.reportModel.countDocuments(active),
    ]);
    return { users, drivers, passengers, rides, bookings, reports };
  }

  async getUsers(): Promise<User[]> {
    return this.userModel
      .find({ deletedAt: null })
      .select('-passwordHash -refreshTokenHash')
      .sort({ createdAt: -1 })
      .lean();
  }

  async toggleBan(id: string, ban: boolean): Promise<{ _id: unknown; isBanned: boolean }> {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.Admin) throw new ForbiddenException('Cannot ban an admin account');
    user.isBanned = ban;
    await user.save();
    return { _id: user._id, isBanned: user.isBanned };
  }

  async softDeleteUser(id: string): Promise<void> {
    const user = await this.userModel.findOne({ _id: id, deletedAt: null });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.Admin) throw new ForbiddenException('Cannot delete an admin account');
    await this.userModel.updateOne({ _id: id }, { deletedAt: new Date() });
  }
}
