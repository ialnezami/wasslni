import apiClient from './client';
import type { Ride } from '@wasslni/shared-types';

export interface RideSearchParams {
  departureCityId?: string;
  destinationCityId?: string;
  date?: string;
}

export interface CreateRidePayload {
  vehicleId: string;
  departureCityId: string;
  destinationCityId: string;
  departurePoint: string;
  destinationPoint?: string;
  date: string;
  departureTime: string;
  price: number;
  totalSeats: number;
  description?: string;
}

export const ridesApi = {
  search: (params?: RideSearchParams) => apiClient.get<Ride[]>('/rides', { params }),
  getById: (id: string) => apiClient.get<Ride>(`/rides/${id}`),
  getMine: () => apiClient.get<Ride[]>('/rides/me'),
  create: (payload: CreateRidePayload) => apiClient.post<Ride>('/rides', payload),
  update: (id: string, payload: Partial<CreateRidePayload>) => apiClient.patch<Ride>(`/rides/${id}`, payload),
  cancel: (id: string) => apiClient.post<Ride>(`/rides/${id}/cancel`),
};
