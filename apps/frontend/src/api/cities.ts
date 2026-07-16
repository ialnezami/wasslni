import apiClient from './client';
import type { City } from '@wasslni/shared-types';

export interface CityPayload {
  nameAr: string;
  nameFr: string;
  nameEn?: string;
  lat: number;
  lng: number;
}

export const citiesApi = {
  getAll: () => apiClient.get<City[]>('/cities'),
  create: (dto: CityPayload) => apiClient.post<City>('/cities', dto),
  update: (id: string, dto: Partial<CityPayload>) => apiClient.patch<City>(`/cities/${id}`, dto),
  remove: (id: string) => apiClient.delete(`/cities/${id}`),
};
