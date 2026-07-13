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
    _id: 'city-casa',
    nameAr: 'الدار البيضاء',
    nameFr: 'Casablanca',
    nameEn: 'Casablanca',
    lat: 33.5731,
    lng: -7.5898,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'city-rabat',
    nameAr: 'الرباط',
    nameFr: 'Rabat',
    nameEn: 'Rabat',
    lat: 34.0209,
    lng: -6.8416,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'city-fes',
    nameAr: 'فاس',
    nameFr: 'Fès',
    nameEn: 'Fes',
    lat: 34.0181,
    lng: -5.0078,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'city-marrakech',
    nameAr: 'مراكش',
    nameFr: 'Marrakech',
    nameEn: 'Marrakech',
    lat: 31.6295,
    lng: -7.9811,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    _id: 'city-tanger',
    nameAr: 'طنجة',
    nameFr: 'Tanger',
    nameEn: 'Tangier',
    lat: 35.7595,
    lng: -5.834,
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
    departureCityId: 'city-casa',
    destinationCityId: 'city-rabat',
    departureCityName: 'الدار البيضاء',
    destinationCityName: 'الرباط',
    departurePoint: 'محطة القطار',
    destinationPoint: 'وسط المدينة',
    date: '2026-07-15',
    departureTime: '08:00',
    price: 80,
    totalSeats: 3,
    availableSeats: 2,
    description: 'رحلة مريحة مع تكييف. التوقف عند الحاجة.',
    status: RideStatusEnum.Scheduled,
    driverName: 'يوسف العلمي',
    driverRating: 4.8,
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
  },
  {
    _id: 'ride-2',
    driverId: 'driver-2',
    vehicleId: 'vehicle-2',
    departureCityId: 'city-casa',
    destinationCityId: 'city-rabat',
    departureCityName: 'الدار البيضاء',
    destinationCityName: 'الرباط',
    departurePoint: 'عين السبع',
    destinationPoint: 'أكدال',
    date: '2026-07-15',
    departureTime: '10:30',
    price: 70,
    totalSeats: 4,
    availableSeats: 3,
    status: RideStatusEnum.Scheduled,
    driverName: 'سارة بنعلي',
    driverRating: 4.9,
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
  },
  {
    _id: 'ride-3',
    driverId: 'driver-3',
    vehicleId: 'vehicle-3',
    departureCityId: 'city-rabat',
    destinationCityId: 'city-fes',
    departureCityName: 'الرباط',
    destinationCityName: 'فاس',
    departurePoint: 'محطة الحافلات',
    date: '2026-07-16',
    departureTime: '07:00',
    price: 120,
    totalSeats: 3,
    availableSeats: 1,
    status: RideStatusEnum.Scheduled,
    driverName: 'محمد الإدريسي',
    driverRating: 4.6,
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
  },
  {
    _id: 'ride-4',
    driverId: 'driver-4',
    vehicleId: 'vehicle-4',
    departureCityId: 'city-marrakech',
    destinationCityId: 'city-casa',
    departureCityName: 'مراكش',
    destinationCityName: 'الدار البيضاء',
    departurePoint: 'جامع الفنا',
    destinationPoint: 'المدينة الجديدة',
    date: '2026-07-17',
    departureTime: '14:00',
    price: 100,
    totalSeats: 3,
    availableSeats: 3,
    status: RideStatusEnum.Scheduled,
    driverName: 'فاطمة الزهراء',
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
      role: UserRole.Passenger,
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
      role: UserRole.Driver,
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
