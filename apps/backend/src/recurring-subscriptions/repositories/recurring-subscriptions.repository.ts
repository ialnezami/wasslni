import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecurringSubscription } from '../schemas/recurring-subscription.schema';
import { RecurringSubscriptionStatus } from '@wasslni/shared-types';

@Injectable()
export class RecurringSubscriptionsRepository {
  constructor(@InjectModel(RecurringSubscription.name) private readonly model: Model<RecurringSubscription>) {}

  findById(id: string) { return this.model.findOne({ _id: id, deletedAt: null }).exec(); }
  findByRecurringTrip(recurringTripId: string) { return this.model.find({ recurringTripId, deletedAt: null }).sort({ createdAt: -1 }).exec(); }
  findActiveByRecurringTrip(recurringTripId: string) { return this.model.find({ recurringTripId, status: RecurringSubscriptionStatus.Active, deletedAt: null }).exec(); }
  findByTripAndPassenger(recurringTripId: string, passengerId: string) { return this.model.findOne({ recurringTripId, passengerId, deletedAt: null }).exec(); }
  findByPassenger(passengerId: string) { return this.model.find({ passengerId, deletedAt: null }).sort({ createdAt: -1 }).exec(); }
  create(data: Partial<RecurringSubscription>) { return this.model.create(data); }
  updateById(id: string, data: Partial<RecurringSubscription>) { return this.model.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).exec(); }
  addSkippedDate(id: string, date: string) { return this.model.findOneAndUpdate({ _id: id, deletedAt: null }, { $addToSet: { skippedDates: date } }, { new: true }).exec(); }
}
