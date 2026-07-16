import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../schemas/message.schema';

@Injectable()
export class MessagesRepository {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
  ) {}

  findByBooking(bookingId: string) {
    return this.messageModel
      .find({ bookingId, deletedAt: null })
      .sort({ createdAt: 1 })
      .exec();
  }

  create(data: { bookingId: string; senderId: string; text: string }) {
    return this.messageModel.create(data);
  }

  markAllRead(bookingId: string, userId: string) {
    const uid = new Types.ObjectId(userId);
    return this.messageModel.updateMany(
      {
        bookingId: new Types.ObjectId(bookingId),
        senderId: { $ne: uid },
        readBy: { $nin: [uid] },
        deletedAt: null,
      },
      { $addToSet: { readBy: uid } },
    ).exec();
  }

  findLastMessagesByBookingIds(bookingIds: Types.ObjectId[]) {
    if (bookingIds.length === 0) return Promise.resolve([]);
    return this.messageModel.aggregate([
      { $match: { bookingId: { $in: bookingIds }, deletedAt: null } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$bookingId', lastMessage: { $first: '$$ROOT' } } },
    ]);
  }

  countUnreadByBookingIds(bookingIds: Types.ObjectId[], userId: string) {
    if (bookingIds.length === 0) return Promise.resolve([]);
    const uid = new Types.ObjectId(userId);
    return this.messageModel.aggregate([
      {
        $match: {
          bookingId: { $in: bookingIds },
          senderId: { $ne: uid },
          readBy: { $nin: [uid] },
          deletedAt: null,
        },
      },
      { $group: { _id: '$bookingId', unreadCount: { $sum: 1 } } },
    ]);
  }
}
