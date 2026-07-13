import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  findById(id: string) {
    return this.userModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  findByIdWithCredentials(id: string) {
    return this.userModel
      .findOne({ _id: id, deletedAt: null })
      .select('+passwordHash +refreshTokenHash')
      .exec();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email, deletedAt: null }).exec();
  }

  findByEmailWithCredentials(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase(), deletedAt: null })
      .select('+passwordHash +refreshTokenHash')
      .exec();
  }

  create(data: Partial<User>) {
    return this.userModel.create(data);
  }

  updateById(id: string, data: Partial<User>) {
    return this.userModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true })
      .exec();
  }

  setRefreshTokenHash(id: string, refreshTokenHash?: string) {
    return this.userModel
      .updateOne({ _id: id, deletedAt: null }, { refreshTokenHash })
      .exec();
  }

  findAll(filter: Record<string, unknown> = {}) {
    return this.userModel.find({ deletedAt: null, ...filter }).sort({ createdAt: -1 }).exec();
  }

  count(filter: Record<string, unknown> = {}) {
    return this.userModel.countDocuments({ deletedAt: null, ...filter }).exec();
  }
}
