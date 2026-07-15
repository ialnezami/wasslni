import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking } from '../schemas/booking.schema';
import { BookingStatus } from '@wasslni/shared-types';

@Injectable()
export class BookingsRepository {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<Booking>,
  ) {}

  findByPassenger(passengerId: string) {
    return this.bookingModel
      .find({ passengerId, deletedAt: null })
      .sort({ createdAt: -1 })
      .exec();
  }

  findByPassengerWithRide(passengerId: string) {
    return this.bookingModel
      .find({ passengerId, deletedAt: null })
      .populate({
        path: 'rideId',
        populate: [
          { path: 'departureCityId', select: 'nameAr nameFr nameEn' },
          { path: 'destinationCityId', select: 'nameAr nameFr nameEn' },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  findByRide(rideId: string) { return this.bookingModel.find({ rideId, deletedAt: null }).sort({ createdAt: -1 }).exec(); }
  findByRideIds(rideIds: string[]) { return this.bookingModel.find({ rideId: { $in: rideIds }, deletedAt: null }).sort({ createdAt: -1 }).exec(); }
  findById(id: string) { return this.bookingModel.findOne({ _id: id, deletedAt: null }).exec(); }
  findActiveByRideAndPassenger(rideId: string, passengerId: string) { return this.bookingModel.findOne({ rideId, passengerId, status: { $in: [BookingStatus.Pending, BookingStatus.Accepted] }, deletedAt: null }).exec(); }
  create(data: Partial<Booking>) { return this.bookingModel.create(data); }
  updateStatus(id: string, status: BookingStatus) { return this.bookingModel.findOneAndUpdate({ _id: id, deletedAt: null }, { status }, { new: true }).exec(); }
  count(filter: Record<string, unknown> = {}) { return this.bookingModel.countDocuments({ deletedAt: null, ...filter }).exec(); }

  findAllForUserWithRide(userId: string) {
    const uid = new Types.ObjectId(userId);
    return this.bookingModel.aggregate([
      {
        $lookup: {
          from: 'rides',
          localField: 'rideId',
          foreignField: '_id',
          as: 'ride',
        },
      },
      { $unwind: '$ride' },
      {
        $match: {
          deletedAt: null,
          $or: [{ passengerId: uid }, { 'ride.driverId': uid }],
        },
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'ride.departureCityId',
          foreignField: '_id',
          as: 'departureCity',
        },
      },
      { $unwind: { path: '$departureCity', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'cities',
          localField: 'ride.destinationCityId',
          foreignField: '_id',
          as: 'destinationCity',
        },
      },
      { $unwind: { path: '$destinationCity', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          status: 1,
          seats: 1,
          passengerId: 1,
          createdAt: 1,
          'ride._id': 1,
          'ride.driverId': 1,
          'ride.date': 1,
          'ride.departureTime': 1,
          'departureCity.nameAr': 1,
          'departureCity.nameFr': 1,
          'departureCity.nameEn': 1,
          'destinationCity.nameAr': 1,
          'destinationCity.nameFr': 1,
          'destinationCity.nameEn': 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
  }
}
