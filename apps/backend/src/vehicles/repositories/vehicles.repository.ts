import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle } from '../schemas/vehicle.schema';

@Injectable()
export class VehiclesRepository {
  constructor(
    @InjectModel(Vehicle.name) private readonly vehicleModel: Model<Vehicle>,
  ) {}

  findByDriver(driverId: string) {
    return this.vehicleModel.find({ driverId, deletedAt: null }).exec();
  }

  findByIdAndDriver(id: string, driverId: string) { return this.vehicleModel.findOne({ _id: id, driverId, deletedAt: null }).exec(); }
  findById(id: string) { return this.vehicleModel.findOne({ _id: id, deletedAt: null }).exec(); }
  create(data: Partial<Vehicle>) { return this.vehicleModel.create(data); }
  updateById(id: string, driverId: string, data: Partial<Vehicle>) { return this.vehicleModel.findOneAndUpdate({ _id: id, driverId, deletedAt: null }, data, { new: true }).exec(); }
  softDelete(id: string, driverId: string) { return this.vehicleModel.findOneAndUpdate({ _id: id, driverId, deletedAt: null }, { deletedAt: new Date() }, { new: true }).exec(); }
}
