import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessagesRepository } from './repositories/messages.repository';
import { BookingsRepository } from '../bookings/repositories/bookings.repository';
import { RidesRepository } from '../rides/repositories/rides.repository';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly ridesRepository: RidesRepository,
  ) {}

  async getHistory(bookingId: string, requesterId: string) {
    await this.assertParticipant(bookingId, requesterId);
    return this.messagesRepository.findByBooking(bookingId);
  }

  async createMessage(bookingId: string, senderId: string, text: string) {
    await this.assertParticipant(bookingId, senderId);
    return this.messagesRepository.create({ bookingId, senderId, text: text.trim() });
  }

  async assertParticipant(bookingId: string, userId: string): Promise<void> {
    const booking = await this.bookingsRepository.findById(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (String(booking.passengerId) === userId) return;
    const ride = await this.ridesRepository.findById(String(booking.rideId));
    if (!ride || String(ride.driverId) !== userId) {
      throw new ForbiddenException('You are not a participant of this booking');
    }
  }

  async getConversations(userId: string) {
    const bookings = await this.bookingsRepository.findAllForUserWithRide(userId);
    if (bookings.length === 0) return [];

    const bookingIds = bookings.map((b: any) => b._id);
    const lastMessages = await this.messagesRepository.findLastMessagesByBookingIds(bookingIds);
    const lastMsgMap = new Map(lastMessages.map((m: any) => [String(m._id), m.lastMessage]));

    return bookings.map((booking: any) => ({
      bookingId: String(booking._id),
      status: booking.status,
      seats: booking.seats,
      isPassenger: String(booking.passengerId) === userId,
      ride: {
        _id: String(booking.ride._id),
        date: booking.ride.date,
        departureTime: booking.ride.departureTime,
        departureCity: booking.departureCity ?? null,
        destinationCity: booking.destinationCity ?? null,
      },
      lastMessage: lastMsgMap.get(String(booking._id)) ?? null,
      createdAt: booking.createdAt,
    }));
  }
}
