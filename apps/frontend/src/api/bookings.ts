import apiClient from './client';
import type { Booking } from '@wasslni/shared-types';

export const bookingsApi = {
  getMine: () => apiClient.get<Booking[]>('/bookings/me'),
  getForDriver: () => apiClient.get<Booking[]>('/bookings/driver'),
  forRide: (rideId: string) => apiClient.get<Booking[]>(`/bookings/ride/${rideId}`),
  create: (rideId: string, seats: number) => apiClient.post<Booking>('/bookings', { rideId, seats }),
  accept: (id: string) => apiClient.post<Booking>(`/bookings/${id}/accept`),
  reject: (id: string) => apiClient.post<Booking>(`/bookings/${id}/reject`),
  cancel: (id: string) => apiClient.post<Booking>(`/bookings/${id}/cancel`),
};
