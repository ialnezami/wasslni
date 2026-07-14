import apiClient from './client';
import type { Vehicle } from '@wasslni/shared-types';

export interface CreateVehiclePayload {
  brand: string;
  vehicleModel: string;
  year: number;
  color: string;
  licensePlate: string;
  seats: number;
}

export const vehiclesApi = {
  getMine: () => apiClient.get<Vehicle[]>('/vehicles/me'),
  create: (payload: CreateVehiclePayload) => apiClient.post<Vehicle>('/vehicles', payload),
  update: (id: string, payload: Partial<CreateVehiclePayload>) => apiClient.patch<Vehicle>(`/vehicles/${id}`, payload),
  remove: (id: string) => apiClient.delete(`/vehicles/${id}`),
};
