import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { VehiclesRepository } from './repositories/vehicles.repository';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicles.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly vehiclesRepository: VehiclesRepository) {}

  findMine(driverId: string) {
    return this.vehiclesRepository.findByDriver(driverId);
  }

  async create(driverId: string, dto: CreateVehicleDto) {
    try { return await this.vehiclesRepository.create({ ...dto, driverId: driverId as never }); }
    catch (error: unknown) { if ((error as { code?: number }).code === 11000) throw new ConflictException('License plate already exists'); throw error; }
  }

  async update(id: string, driverId: string, dto: UpdateVehicleDto) {
    const vehicle = await this.vehiclesRepository.updateById(id, driverId, dto);
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async remove(id: string, driverId: string) {
    const vehicle = await this.vehiclesRepository.softDelete(id, driverId);
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return { message: 'Vehicle deleted' };
  }
}
