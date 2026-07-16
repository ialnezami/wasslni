import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, NotificationType, RideStatus } from '@wasslni/shared-types';
import { BookingsRepository } from './repositories/bookings.repository';
import { CancelByDriverDto, CreateBookingDto } from './dto/bookings.dto';
import { RidesRepository } from '../rides/repositories/rides.repository';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly ridesRepository: RidesRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  findMine(passengerId: string) {
    return this.bookingsRepository.findByPassengerWithRide(passengerId);
  }

  async findForDriver(driverId: string) {
    const rides = await this.ridesRepository.findByDriver(driverId);
    if (rides.length === 0) return [];
    const rideIds = rides.map((r) => String(r._id));
    return this.bookingsRepository.findByRideIds(rideIds);
  }

  async create(passengerId: string, dto: CreateBookingDto) {
    const ride = await this.ridesRepository.findById(dto.rideId);
    if (!ride || ride.status !== RideStatus.Scheduled) throw new BadRequestException('Ride is not available for booking');
    if (String(ride.driverId) === passengerId) throw new BadRequestException('You cannot book your own ride');
    if (dto.seats > ride.availableSeats) throw new BadRequestException('Not enough available seats');
    if (await this.bookingsRepository.findActiveByRideAndPassenger(dto.rideId, passengerId)) throw new BadRequestException('You already have an active booking for this ride');
    const booking = await this.bookingsRepository.create({ ...dto, passengerId: passengerId as never, status: BookingStatus.Pending } as unknown as Partial<import('./schemas/booking.schema').Booking>);
    await this.notificationsService.create(String(ride.driverId), NotificationType.BookingReceived, 'New booking request', 'A passenger requested seats on your ride.', { bookingId: String(booking._id), rideId: dto.rideId });
    return booking;
  }

  async findForRide(rideId: string, driverId: string) {
    const ride = await this.ridesRepository.findById(rideId);
    if (!ride) throw new NotFoundException('Ride not found');
    if (String(ride.driverId) !== driverId) throw new ForbiddenException('You do not own this ride');
    return this.bookingsRepository.findByRide(rideId);
  }

  async accept(id: string, driverId: string) {
    const booking = await this.bookingsRepository.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');
    const ride = await this.ridesRepository.findById(String(booking.rideId));
    if (!ride || String(ride.driverId) !== driverId) throw new ForbiddenException('You do not own this ride');
    if (booking.status !== BookingStatus.Pending) throw new BadRequestException('Only pending bookings can be accepted');
    if (!await this.ridesRepository.reserveSeats(String(booking.rideId), booking.seats)) throw new BadRequestException('Not enough available seats');
    const updated = await this.bookingsRepository.updateStatus(id, BookingStatus.Accepted);
    await this.notificationsService.create(String(booking.passengerId), NotificationType.BookingApproved, 'Booking approved', 'Your booking request was approved.', { bookingId: id, rideId: String(booking.rideId) });
    return updated;
  }

  async reject(id: string, driverId: string) {
    const booking = await this.bookingForDriver(id, driverId);
    if (booking.status !== BookingStatus.Pending) throw new BadRequestException('Only pending bookings can be rejected');
    const updated = await this.bookingsRepository.updateStatus(id, BookingStatus.Rejected);
    await this.notificationsService.create(String(booking.passengerId), NotificationType.BookingRejected, 'Booking rejected', 'Your booking request was rejected.', { bookingId: id, rideId: String(booking.rideId) });
    return updated;
  }

  async cancel(id: string, passengerId: string) {
    const booking = await this.bookingsRepository.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');
    if (String(booking.passengerId) !== passengerId) throw new ForbiddenException('You do not own this booking');
    if (![BookingStatus.Pending, BookingStatus.Accepted].includes(booking.status)) throw new BadRequestException('Booking cannot be cancelled');
    if (booking.status === BookingStatus.Accepted) await this.ridesRepository.releaseSeats(String(booking.rideId), booking.seats);
    return this.bookingsRepository.updateStatus(id, BookingStatus.Cancelled);
  }

  async cancelByDriver(id: string, driverId: string, dto: CancelByDriverDto) {
    const booking = await this.bookingForDriver(id, driverId);
    if (![BookingStatus.Pending, BookingStatus.Accepted].includes(booking.status)) throw new BadRequestException('Booking cannot be cancelled');
    if (booking.status === BookingStatus.Accepted) await this.ridesRepository.releaseSeats(String(booking.rideId), booking.seats);
    const updated = await this.bookingsRepository.updateStatus(id, BookingStatus.Cancelled, dto.reason);
    await this.notificationsService.create(
      String(booking.passengerId),
      NotificationType.BookingCancelledByDriver,
      'Booking cancelled by driver',
      dto.reason ? `Your booking was cancelled by the driver: ${dto.reason}` : 'Your booking was cancelled by the driver.',
      { bookingId: id, rideId: String(booking.rideId) },
    );
    return updated;
  }

  private async bookingForDriver(id: string, driverId: string) {
    const booking = await this.bookingsRepository.findById(id);
    if (!booking) throw new NotFoundException('Booking not found');
    const ride = await this.ridesRepository.findById(String(booking.rideId));
    if (!ride || String(ride.driverId) !== driverId) throw new ForbiddenException('You do not own this ride');
    return booking;
  }
}
