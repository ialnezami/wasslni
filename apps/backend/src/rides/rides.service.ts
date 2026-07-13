import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RideStatus, UserRole } from '@wasslni/shared-types';
import { RidesRepository } from './repositories/rides.repository';
import { CreateRideDto, SearchRidesDto, UpdateRideDto } from './dto/rides.dto';
import { VehiclesRepository } from '../vehicles/repositories/vehicles.repository';

@Injectable()
export class RidesService {
  constructor(private readonly ridesRepository: RidesRepository, private readonly vehiclesRepository: VehiclesRepository) {}

  search(query: SearchRidesDto) {
    const filter: Record<string, unknown> = { status: RideStatus.Scheduled };
    if (query.departureCityId) filter.departureCityId = query.departureCityId;
    if (query.destinationCityId) filter.destinationCityId = query.destinationCityId;
    if (query.date) filter.date = query.date;
    if (query.seats) filter.availableSeats = { $gte: query.seats };
    if (query.minPrice || query.maxPrice) filter.price = { ...(query.minPrice ? { $gte: query.minPrice } : {}), ...(query.maxPrice ? { $lte: query.maxPrice } : {}) };
    if (query.earliestTime || query.latestTime) filter.departureTime = { ...(query.earliestTime ? { $gte: query.earliestTime } : {}), ...(query.latestTime ? { $lte: query.latestTime } : {}) };
    const sort: Record<string, 1 | -1> = query.sort === 'cheapest' ? { price: 1 } : query.sort === 'latest' ? { departureTime: -1 } : { date: 1, departureTime: 1 };
    return this.ridesRepository.findAll(filter, sort);
  }

  async findOne(id: string) {
    const ride = await this.ridesRepository.findById(id);
    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }

  async findMine(driverId: string) { return this.ridesRepository.findByDriver(driverId); }

  async create(driverId: string, dto: CreateRideDto) {
    if (dto.departureCityId === dto.destinationCityId) throw new BadRequestException('Departure and destination cities must differ');
    const vehicle = await this.vehiclesRepository.findByIdAndDriver(dto.vehicleId, driverId);
    if (!vehicle) throw new BadRequestException('Vehicle not found or does not belong to you');
    if (dto.totalSeats > vehicle.seats) throw new BadRequestException('Ride seats exceed vehicle capacity');
    return this.ridesRepository.create({ ...dto, driverId: driverId as never, availableSeats: dto.totalSeats, status: RideStatus.Scheduled } as unknown as Partial<import('./schemas/ride.schema').Ride>);
  }

  async update(id: string, userId: string, role: UserRole, dto: UpdateRideDto) {
    const ride = await this.findOne(id);
    if (role !== UserRole.Admin && String(ride.driverId) !== userId) throw new ForbiddenException('You do not own this ride');
    if (ride.status !== RideStatus.Scheduled) throw new BadRequestException('Only scheduled rides can be edited');
    const updated = await this.ridesRepository.updateById(id, dto as unknown as Partial<import('./schemas/ride.schema').Ride>);
    if (!updated) throw new NotFoundException('Ride not found');
    return updated;
  }

  async cancel(id: string, userId: string, role: UserRole) {
    const ride = await this.findOne(id);
    if (role !== UserRole.Admin && String(ride.driverId) !== userId) throw new ForbiddenException('You do not own this ride');
    if ([RideStatus.Completed, RideStatus.Cancelled].includes(ride.status)) throw new BadRequestException('Ride cannot be cancelled');
    return this.ridesRepository.updateById(id, { status: RideStatus.Cancelled } as Partial<import('./schemas/ride.schema').Ride>);
  }
}
