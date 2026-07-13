import { useQuery } from '@tanstack/react-query';
import { citiesApi } from '@/api/cities';
import { DEMO_CITIES } from '@/data/demo';
import type { City } from '@wasslni/shared-types';

async function fetchCities(): Promise<City[]> {
  try {
    const { data } = await citiesApi.getAll();
    return data.length > 0 ? data : DEMO_CITIES;
  } catch {
    return DEMO_CITIES;
  }
}

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: fetchCities,
    staleTime: 5 * 60 * 1000,
  });
}
