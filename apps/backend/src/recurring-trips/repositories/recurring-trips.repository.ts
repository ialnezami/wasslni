import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecurringTrip } from '../schemas/recurring-trip.schema';
import { RecurringTripStatus } from '@wasslni/shared-types';

@Injectable()
export class RecurringTripsRepository {
  constructor(@InjectModel(RecurringTrip.name) private readonly model: Model<RecurringTrip>) {}

  findById(id: string) { return this.model.findOne({ _id: id, deletedAt: null }).exec(); }
  findByDriver(driverId: string) { return this.model.find({ driverId, deletedAt: null }).sort({ createdAt: -1 }).exec(); }
  findAllActive() { return this.model.find({ status: RecurringTripStatus.Active, deletedAt: null }).exec(); }
  findCancelledUnprocessed() { return this.model.find({ status: RecurringTripStatus.Cancelled, cascadeProcessedAt: null, deletedAt: null }).exec(); }
  create(data: Partial<RecurringTrip>) { return this.model.create(data); }
  updateById(id: string, data: Partial<RecurringTrip>) { return this.model.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).exec(); }
  updateGeneratedUpTo(id: string, date: Date) { return this.model.findOneAndUpdate({ _id: id }, { generatedUpTo: date }, { new: true }).exec(); }
}
