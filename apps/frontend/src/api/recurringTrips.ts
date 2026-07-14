import apiClient from './client';
import type { RecurringSubscription, RecurringTrip } from '@wasslni/shared-types';

export interface CreateRecurringTripPayload {
  vehicleId: string;
  departureCityId: string;
  destinationCityId: string;
  departurePoint: string;
  destinationPoint?: string;
  departureTime: string;
  price: number;
  totalSeats: number;
  description?: string;
  recurrence: { type: 'daily' | 'weekdays'; days: number[] };
}

export const recurringTripsApi = {
  getMine: () => apiClient.get<RecurringTrip[]>('/recurring-trips/me'),
  create: (data: CreateRecurringTripPayload) => apiClient.post<RecurringTrip>('/recurring-trips', data),
  getOne: (id: string) => apiClient.get<RecurringTrip>(`/recurring-trips/${id}`),
  pause: (id: string) => apiClient.patch<RecurringTrip>(`/recurring-trips/${id}`, { status: 'paused' }),
  resume: (id: string) => apiClient.patch<RecurringTrip>(`/recurring-trips/${id}`, { status: 'active' }),
  cancel: (id: string) => apiClient.patch<RecurringTrip>(`/recurring-trips/${id}`, { status: 'cancelled' }),
  getSubscriptions: (id: string) => apiClient.get<RecurringSubscription[]>(`/recurring-trips/${id}/subscriptions`),
  subscribe: (id: string, seats: number, scheduleDays: number[] | null) =>
    apiClient.post<RecurringSubscription>(`/recurring-trips/${id}/subscribe`, { seats, scheduleDays }),
};
