import {
  BookingStatus,
  NotificationType,
  PaymentStatus,
  ReportReason,
  ReportTargetType,
  RideStatus,
  UserRole,
} from './enums';

export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface User extends BaseEntity {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  photoUrl?: string;
  isVerified: boolean;
  isBanned: boolean;
  averageRating?: number;
}

export interface City extends BaseEntity {
  nameAr: string;
  nameFr: string;
  nameEn?: string;
  lat: number;
  lng: number;
  isActive: boolean;
}

export interface Vehicle extends BaseEntity {
  driverId: string;
  brand: string;
  vehicleModel: string;
  year: number;
  color: string;
  licensePlate: string;
  seats: number;
}

export interface Ride extends BaseEntity {
  driverId: string;
  vehicleId: string;
  departureCityId: string;
  destinationCityId: string;
  departurePoint: string;
  destinationPoint?: string;
  date: string;
  departureTime: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  description?: string;
  status: RideStatus;
}

export interface Booking extends BaseEntity {
  rideId: string;
  passengerId: string;
  seats: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
}

export interface Review extends BaseEntity {
  rideId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}

export interface Report extends BaseEntity {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  userId: string;
  role: UserRole;
  email: string;
  fullName: string;
}

export interface ApiErrorResponse {
  message: string;
  code: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
