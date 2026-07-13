import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BookingStatus } from '@wasslni/shared-types';
import type { RideWithDetails } from '@/data/demo';

export interface LocalBooking {
  id: string;
  rideId: string;
  ride: RideWithDetails;
  seats: number;
  status: BookingStatus;
  createdAt: string;
}

interface BookingsState {
  bookings: LocalBooking[];
  addBooking: (ride: RideWithDetails, seats: number) => LocalBooking;
  cancelBooking: (id: string) => void;
}

export const useBookingsStore = create<BookingsState>()(
  persist(
    (set, get) => ({
      bookings: [],
      addBooking: (ride, seats) => {
        const booking: LocalBooking = {
          id: `booking-${Date.now()}`,
          rideId: ride._id,
          ride,
          seats,
          status: BookingStatus.Pending,
          createdAt: new Date().toISOString(),
        };
        set({ bookings: [booking, ...get().bookings] });
        return booking;
      },
      cancelBooking: (id) => {
        set({
          bookings: get().bookings.map((b) =>
            b.id === id ? { ...b, status: BookingStatus.Cancelled } : b,
          ),
        });
      },
    }),
    { name: 'wasslni-bookings' },
  ),
);
