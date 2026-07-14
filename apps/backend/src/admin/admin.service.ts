import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRole } from '@wasslni/shared-types';
import { User } from '../users/schemas/user.schema';
import { Ride } from '../rides/schemas/ride.schema';
import { Booking } from '../bookings/schemas/booking.schema';
import { Report } from '../reports/schemas/report.schema';
import { Review } from '../reviews/schemas/review.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Ride.name) private readonly rideModel: Model<Ride>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<Booking>,
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
    @InjectModel(Review.name) private readonly reviewModel: Model<Review>,
  ) {}

  async getDashboardStats() {
    const active = { deletedAt: null };
    const [users, rides, bookings, reports] = await Promise.all([
      this.userModel.countDocuments(active),
      this.rideModel.countDocuments(active),
      this.bookingModel.countDocuments(active),
      this.reportModel.countDocuments(active),
    ]);
    return { users, rides, bookings, reports };
  }

  async getUsers() {
    return this.userModel
      .find({ deletedAt: null })
      .select('-passwordHash -refreshTokenHash')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
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

  async getReports() {
    return this.reportModel
      .find({ deletedAt: null })
      .populate('reporterId', 'fullName email role')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getReviews() {
    return this.reviewModel
      .find({ deletedAt: null })
      .populate('reviewerId', 'fullName email role')
      .populate('revieweeId', 'fullName email role')
      .sort({ createdAt: -1 })
      .lean();
  }

  async deleteReport(id: string): Promise<void> {
    const report = await this.reportModel.findOne({ _id: id, deletedAt: null });
    if (!report) throw new NotFoundException('Report not found');
    await this.reportModel.updateOne({ _id: id }, { deletedAt: new Date() });
  }
}
