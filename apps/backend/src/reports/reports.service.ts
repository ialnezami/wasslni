import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './repositories/reports.repository';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  findAll() {
    return this.reportsRepository.findAll();
  }

  create(reporterId: string, dto: CreateReportDto) {
    return this.reportsRepository.create({ ...dto, reporterId: reporterId as never } as unknown as Partial<import('./schemas/report.schema').Report>);
  }
}
