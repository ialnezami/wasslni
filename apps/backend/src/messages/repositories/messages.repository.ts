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

  findLastMessagesByBookingIds(bookingIds: Types.ObjectId[]) {
    if (bookingIds.length === 0) return Promise.resolve([]);
    return this.messageModel.aggregate([
      { $match: { bookingId: { $in: bookingIds }, deletedAt: null } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$bookingId', lastMessage: { $first: '$$ROOT' } } },
    ]);
  }
}
