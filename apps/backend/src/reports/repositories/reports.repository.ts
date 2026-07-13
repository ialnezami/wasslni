import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report } from '../schemas/report.schema';

@Injectable()
export class ReportsRepository {
  constructor(
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
  ) {}

  findAll() {
    return this.reportModel.find({ deletedAt: null }).sort({ createdAt: -1 }).exec();
  }

  create(data: Partial<Report>) { return this.reportModel.create(data); }
}
