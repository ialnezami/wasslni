import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from '../schemas/notification.schema';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  findByUser(userId: string) {
    return this.notificationModel
      .find({ userId, deletedAt: null })
      .sort({ createdAt: -1 })
      .exec();
  }

  create(data: Partial<Notification>) { return this.notificationModel.create(data); }
  markRead(id: string, userId: string) { return this.notificationModel.findOneAndUpdate({ _id: id, userId, deletedAt: null }, { isRead: true }, { new: true }).exec(); }
}
