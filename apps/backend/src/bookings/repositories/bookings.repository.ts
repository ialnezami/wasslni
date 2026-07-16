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
  findActiveByRide(rideId: string) { return this.bookingModel.find({ rideId, status: { $in: [BookingStatus.Pending, BookingStatus.Accepted] }, deletedAt: null }).exec(); }
  create(data: Partial<Booking>) { return this.bookingModel.create(data); }
  updateStatus(id: string, status: BookingStatus, cancellationReason?: string) { return this.bookingModel.findOneAndUpdate({ _id: id, deletedAt: null }, { status, ...(cancellationReason ? { cancellationReason } : {}) }, { new: true }).exec(); }
  cancelAllActiveByRide(rideId: string, cancellationReason?: string) { return this.bookingModel.updateMany({ rideId, status: { $in: [BookingStatus.Pending, BookingStatus.Accepted] }, deletedAt: null }, { status: BookingStatus.Cancelled, ...(cancellationReason ? { cancellationReason } : {}) }).exec(); }
  count(filter: Record<string, unknown> = {}) { return this.bookingModel.countDocuments({ deletedAt: null, ...filter }).exec(); }

  findAllForUserWithRide(userId: string) {
    const uid = new Types.ObjectId(userId);
    // Some legacy documents store rideId/passengerId/driverId as strings instead of ObjectId.
    // $toObjectId handles both: if value is already ObjectId it's a no-op; if string it converts.
    const toOid = (field: string) => ({
      $cond: [{ $eq: [{ $type: field }, 'string'] }, { $toObjectId: field }, field],
    });
    return this.bookingModel.aggregate([
      // Normalise rideId so the lookup works regardless of stored type
      { $addFields: { rideIdOid: toOid('$rideId') } },
      {
        $lookup: {
          from: 'rides',
          localField: 'rideIdOid',
          foreignField: '_id',
          as: 'ride',
        },
      },
      { $unwind: '$ride' },
      // Normalise passengerId and ride.driverId for the user match
      {
        $addFields: {
          passengerIdOid: toOid('$passengerId'),
          rideDriverIdOid: toOid('$ride.driverId'),
        },
      },
      {
        $match: {
          deletedAt: null,
          $or: [{ passengerIdOid: uid }, { rideDriverIdOid: uid }],
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
