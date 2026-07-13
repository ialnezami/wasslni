import apiClient from './client';
import type { City } from '@wasslni/shared-types';

export const citiesApi = {
  getAll: () => apiClient.get<City[]>('/cities'),
};
