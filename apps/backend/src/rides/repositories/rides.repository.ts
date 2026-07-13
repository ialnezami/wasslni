import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Ride } from '../schemas/ride.schema';
import { RideStatus } from '@wasslni/shared-types';

@Injectable()
export class RidesRepository {
  constructor(@InjectModel(Ride.name) private readonly rideModel: Model<Ride>) {}

  findAll(filter: FilterQuery<Ride> = {}, sort: Record<string, 1 | -1> = { date: 1, departureTime: 1 }) {
    return this.rideModel.find({ deletedAt: null, ...filter }).sort(sort).exec();
  }

  findById(id: string) {
    return this.rideModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  findByDriver(driverId: string) {
    return this.findAll({ driverId } as FilterQuery<Ride>);
  }

  create(data: Partial<Ride>) { return this.rideModel.create(data); }

  updateById(id: string, data: Partial<Ride>) {
    return this.rideModel.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).exec();
  }

  reserveSeats(id: string, seats: number) {
    return this.rideModel.findOneAndUpdate(
      { _id: id, deletedAt: null, status: RideStatus.Scheduled, availableSeats: { $gte: seats } },
      [{ $set: { availableSeats: { $subtract: ['$availableSeats', seats] } } }, { $set: { status: { $cond: [{ $eq: ['$availableSeats', 0] }, RideStatus.Full, RideStatus.Scheduled] } } }],
      { new: true },
    ).exec();
  }

  releaseSeats(id: string, seats: number) {
    return this.rideModel.findOneAndUpdate(
      { _id: id, deletedAt: null, status: { $in: [RideStatus.Scheduled, RideStatus.Full] } },
      { $inc: { availableSeats: seats }, $set: { status: RideStatus.Scheduled } },
      { new: true },
    ).exec();
  }

  count(filter: FilterQuery<Ride> = {}) { return this.rideModel.countDocuments({ deletedAt: null, ...filter }).exec(); }
}
