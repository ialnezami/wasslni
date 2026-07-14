import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RecurringTripStatus } from '@wasslni/shared-types';
import { RecurringTripsRepository } from './repositories/recurring-trips.repository';
import { VehiclesRepository } from '../vehicles/repositories/vehicles.repository';
import { CreateRecurringTripDto, UpdateRecurringTripDto } from './dto/recurring-trips.dto';
import type { RecurringTrip } from './schemas/recurring-trip.schema';

@Injectable()
export class RecurringTripsService {
  constructor(
    private readonly recurringTripsRepository: RecurringTripsRepository,
    private readonly vehiclesRepository: VehiclesRepository,
  ) {}

  findMine(driverId: string) { return this.recurringTripsRepository.findByDriver(driverId); }

  async findOne(id: string) {
    const trip = await this.recurringTripsRepository.findById(id);
    if (!trip) throw new NotFoundException('Recurring trip not found');
    return trip;
  }

  async create(driverId: string, dto: CreateRecurringTripDto) {
    if (dto.departureCityId === dto.destinationCityId) throw new BadRequestException('Departure and destination cities must differ');
    if (dto.recurrence.type === 'weekdays' && dto.recurrence.days.length === 0) throw new BadRequestException('Weekdays recurrence requires at least one day');
    const vehicle = await this.vehiclesRepository.findByIdAndDriver(dto.vehicleId, driverId);
    if (!vehicle) throw new BadRequestException('Vehicle not found or does not belong to you');
    if (dto.totalSeats > vehicle.seats) throw new BadRequestException('Seats exceed vehicle capacity');
    const days = [...new Set(dto.recurrence.days)];
    return this.recurringTripsRepository.create({
      ...dto, recurrence: { type: dto.recurrence.type, days },
      driverId: driverId as never, status: RecurringTripStatus.Active, generatedUpTo: new Date(), cascadeProcessedAt: null,
    } as unknown as Partial<RecurringTrip>);
  }

  async update(id: string, driverId: string, dto: UpdateRecurringTripDto) {
    const trip = await this.findOne(id);
    if (String(trip.driverId) !== driverId) throw new ForbiddenException('You do not own this recurring trip');
    if (trip.status === RecurringTripStatus.Cancelled) throw new BadRequestException('Cancelled trips cannot be modified');
    return this.recurringTripsRepository.updateById(id, dto as Partial<RecurringTrip>);
  }

  async verifyOwnership(id: string, driverId: string) {
    const trip = await this.findOne(id);
    if (String(trip.driverId) !== driverId) throw new ForbiddenException('You do not own this recurring trip');
    return trip;
  }
}
