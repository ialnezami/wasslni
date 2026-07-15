import { useQuery } from '@tanstack/react-query';
import { ridesApi } from '@/api/rides';
import { DEMO_RIDES, filterRides, type RideWithDetails } from '@/data/demo';

export interface RideSearchParams {
  departureCityId?: string;
  destinationCityId?: string;
  date?: string;
}

const DEMO_ID_PREFIX = 'ride-';

export function isDemoRide(id: string): boolean {
  return id.startsWith(DEMO_ID_PREFIX);
}

async function fetchRides(params: RideSearchParams): Promise<RideWithDetails[]> {
  try {
    const { data } = await ridesApi.search(params);
    if (data.length > 0) {
      return data as RideWithDetails[];
    }
  } catch {
    // fall through to demo data when backend unreachable
  }
  return filterRides(DEMO_RIDES, params);
}

export function useRides(params: RideSearchParams) {
  return useQuery({
    queryKey: ['rides', params],
    queryFn: () => fetchRides(params),
  });
}

export function useRide(id: string) {
  return useQuery({
    queryKey: ['ride', id],
    queryFn: async () => {
      // Demo rides are only shown when the backend is unreachable
      if (isDemoRide(id)) {
        const demo = DEMO_RIDES.find((r) => r._id === id);
        if (!demo) throw new Error('Ride not found');
        return demo;
      }

      try {
        const { data } = await ridesApi.getById(id);
        return data as RideWithDetails;
      } catch {
        throw new Error('Ride not found');
      }
    },
    enabled: Boolean(id),
  });
}
