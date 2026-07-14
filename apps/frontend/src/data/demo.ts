import type { City, Ride, RideStatus } from '@wasslni/shared-types';
import { RideStatus as RideStatusEnum, UserRole } from '@wasslni/shared-types';

export interface RideWithDetails extends Ride {
  driverName: string;
  driverRating: number;
  departureCityName: string;
  destinationCityName: string;
}

export const DEMO_CITIES: City[] = [
  {
    _id: 'city-damascus',
    nameAr: 'دمشق',
    nameFr: 'Damas',
    nameEn: 'Damascus',
    lat: 33.5138,
    lng: 36.2765,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'city-aleppo',
    nameAr: 'حلب',
    nameFr: 'Alep',
    nameEn: 'Aleppo',
    lat: 36.2021,
    lng: 37.1343,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'city-homs',
    nameAr: 'حمص',
    nameFr: 'Homs',
    nameEn: 'Homs',
    lat: 34.7324,
    lng: 36.7137,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'city-hama',
    nameAr: 'حماة',
    nameFr: 'Hama',
    nameEn: 'Hama',
    lat: 35.1318,
    lng: 36.758,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'city-latakia',
    nameAr: 'اللاذقية',
    nameFr: 'Lattaquié',
    nameEn: 'Latakia',
    lat: 35.5317,
    lng: 35.7915,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const DEMO_RIDES: RideWithDetails[] = [
  {
    _id: 'ride-1',
    driverId: 'driver-1',
    vehicleId: 'vehicle-1',
    departureCityId: 'city-damascus',
    destinationCityId: 'city-aleppo',
    departureCityName: 'دمشق',
    destinationCityName: 'حلب',
    departurePoint: 'كراج السومرية',
    destinationPoint: 'الجميلية',
    date: '2026-07-15',
    departureTime: '07:00',
    price: 8000,
    totalSeats: 4,
    availableSeats: 2,
    description: 'رحلة مريحة بسيارة حديثة مع تكييف.',
    status: RideStatusEnum.Scheduled,
    driverName: 'أحمد الخطيب',
    driverRating: 4.8,
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
  },
  {
    _id: 'ride-2',
    driverId: 'driver-2',
    vehicleId: 'vehicle-2',
    departureCityId: 'city-damascus',
    destinationCityId: 'city-homs',
    departureCityName: 'دمشق',
    destinationCityName: 'حمص',
    departurePoint: 'كراج العباسيين',
    destinationPoint: 'حي الوعر',
    date: '2026-07-15',
    departureTime: '09:30',
    price: 5000,
    totalSeats: 4,
    availableSeats: 3,
    status: RideStatusEnum.Scheduled,
    driverName: 'سمر العلي',
    driverRating: 4.9,
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
  },
  {
    _id: 'ride-3',
    driverId: 'driver-3',
    vehicleId: 'vehicle-3',
    departureCityId: 'city-homs',
    destinationCityId: 'city-aleppo',
    departureCityName: 'حمص',
    destinationCityName: 'حلب',
    departurePoint: 'وسط المدينة',
    date: '2026-07-16',
    departureTime: '06:00',
    price: 6000,
    totalSeats: 3,
    availableSeats: 1,
    status: RideStatusEnum.Scheduled,
    driverName: 'محمد الزعيم',
    driverRating: 4.6,
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
  },
  {
    _id: 'ride-4',
    driverId: 'driver-4',
    vehicleId: 'vehicle-4',
    departureCityId: 'city-latakia',
    destinationCityId: 'city-damascus',
    departureCityName: 'اللاذقية',
    destinationCityName: 'دمشق',
    departurePoint: 'الكورنيش',
    destinationPoint: 'كراج السومرية',
    date: '2026-07-17',
    departureTime: '05:30',
    price: 10000,
    totalSeats: 4,
    availableSeats: 4,
    status: RideStatusEnum.Scheduled,
    driverName: 'رنا الحسن',
    driverRating: 5,
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
  },
];

export const DEMO_USERS = {
  passenger: {
    email: 'passenger@demo.com',
    password: 'demo1234',
    user: {
      userId: 'demo-passenger',
      role: UserRole.User,
      email: 'passenger@demo.com',
      fullName: 'أحمد الرحالي',
    },
    accessToken: 'demo-passenger-token',
  },
  driver: {
    email: 'driver@demo.com',
    password: 'demo1234',
    user: {
      userId: 'demo-driver',
      role: UserRole.User,
      email: 'driver@demo.com',
      fullName: 'يوسف العلمي',
    },
    accessToken: 'demo-driver-token',
  },
};

export function getCityName(
  city: City,
  locale: string,
): string {
  if (locale === 'ar') return city.nameAr;
  if (locale === 'fr') return city.nameFr;
  return city.nameEn ?? city.nameFr;
}

export function filterRides(
  rides: RideWithDetails[],
  params: {
    departureCityId?: string;
    destinationCityId?: string;
    date?: string;
  },
): RideWithDetails[] {
  return rides.filter((ride) => {
    if (params.departureCityId && ride.departureCityId !== params.departureCityId) {
      return false;
    }
    if (params.destinationCityId && ride.destinationCityId !== params.destinationCityId) {
      return false;
    }
    if (params.date && ride.date !== params.date) {
      return false;
    }
    return ride.status === RideStatusEnum.Scheduled && ride.availableSeats > 0;
  });
}

export function getRideStatusLabel(status: RideStatus, t: (key: string) => string): string {
  const map: Record<RideStatus, string> = {
    Scheduled: t('ride.status.scheduled'),
    Full: t('ride.status.full'),
    Completed: t('ride.status.completed'),
    Cancelled: t('ride.status.cancelled'),
  };
  return map[status];
}
