import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { RidesRepository } from '../rides/repositories/rides.repository';
import { BookingsRepository } from '../bookings/repositories/bookings.repository';
import { MessagesRepository } from './repositories/messages.repository';

const CHAT_TTL_MS = 48 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class ChatCleanupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ChatCleanupService.name);

  constructor(
    private readonly ridesRepository: RidesRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly messagesRepository: MessagesRepository,
  ) {}

  onApplicationBootstrap() {
    void this.run();
    setInterval(() => void this.run(), CLEANUP_INTERVAL_MS);
  }

  async run() {
    try {
      const cutoff = new Date(Date.now() - CHAT_TTL_MS);
      const completedRides = await this.ridesRepository.findCompletedBefore(cutoff);
      if (completedRides.length === 0) return;

      const rideIds = completedRides.map((r) => String(r._id));
      const bookings = await this.bookingsRepository.findByRideIds(rideIds);
      if (bookings.length === 0) return;

      const bookingIds = bookings.map((b) => String(b._id));
      const result = await this.messagesRepository.softDeleteByBookingIds(bookingIds);

      if (result.modifiedCount > 0) {
        this.logger.log(
          `Chat cleanup: soft-deleted ${result.modifiedCount} messages from ${bookings.length} bookings across ${completedRides.length} rides`,
        );
      }
    } catch (err) {
      this.logger.error('Chat cleanup failed', err instanceof Error ? err.stack : String(err));
    }
  }
}
