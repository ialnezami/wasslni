import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { City } from '../schemas/city.schema';

@Injectable()
export class CitiesRepository {
  constructor(@InjectModel(City.name) private readonly cityModel: Model<City>) {}

  findActive() {
    return this.cityModel.find({ isActive: true, deletedAt: null }).exec();
  }

  create(data: Partial<City>) { return this.cityModel.create(data); }
  updateById(id: string, data: Partial<City>) { return this.cityModel.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).exec(); }
  softDelete(id: string) { return this.cityModel.findOneAndUpdate({ _id: id, deletedAt: null }, { deletedAt: new Date(), isActive: false }, { new: true }).exec(); }
}
