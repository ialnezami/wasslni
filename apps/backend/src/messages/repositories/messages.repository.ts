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
    // bookingId may be stored as string or ObjectId — match both
    return this.messageModel
      .find({ $or: [{ bookingId }, { bookingId: new Types.ObjectId(bookingId) }], deletedAt: null })
      .sort({ createdAt: 1 })
      .exec();
  }

  create(data: { bookingId: string; senderId: string; text: string }) {
    return this.messageModel.create(data);
  }

  markAllRead(bookingId: string, userId: string) {
    const uid = new Types.ObjectId(userId);
    // Match bookingId stored as either string or ObjectId
    return this.messageModel.updateMany(
      {
        $or: [{ bookingId }, { bookingId: new Types.ObjectId(bookingId) }],
        senderId: { $ne: uid },
        readBy: { $nin: [uid] },
        deletedAt: null,
      },
      { $addToSet: { readBy: uid } },
    ).exec();
  }

  findLastMessagesByBookingIds(bookingIds: Types.ObjectId[]) {
    if (bookingIds.length === 0) return Promise.resolve([]);
    // Some messages store bookingId as string; normalise to string for comparison
    const idStrs = bookingIds.map((id) => id.toString());
    return this.messageModel.aggregate([
      {
        $match: {
          $expr: { $in: [{ $toString: '$bookingId' }, idStrs] },
          deletedAt: null,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { $toString: '$bookingId' },
          lastMessage: { $first: '$$ROOT' },
        },
      },
    ]);
  }

  softDeleteByBookingIds(bookingIds: string[]) {
    if (bookingIds.length === 0) return Promise.resolve({ modifiedCount: 0 });
    const idOids = bookingIds.map((id) => new Types.ObjectId(id));
    return this.messageModel.updateMany(
      { bookingId: { $in: [...bookingIds, ...idOids] }, deletedAt: null },
      { deletedAt: new Date() },
    ).exec();
  }

  countUnreadByBookingIds(bookingIds: Types.ObjectId[], userId: string) {
    if (bookingIds.length === 0) return Promise.resolve([]);
    const uid = new Types.ObjectId(userId);
    const idStrs = bookingIds.map((id) => id.toString());
    return this.messageModel.aggregate([
      {
        $match: {
          $expr: { $in: [{ $toString: '$bookingId' }, idStrs] },
          senderId: { $ne: uid },
          readBy: { $nin: [uid] },
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: { $toString: '$bookingId' },
          unreadCount: { $sum: 1 },
        },
      },
    ]);
  }
}
