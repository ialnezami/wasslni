export enum UserRole {
  Admin = 'Admin',
  Driver = 'Driver',
  Passenger = 'Passenger',
}

export enum RideStatus {
  Scheduled = 'Scheduled',
  Full = 'Full',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum BookingStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
}

export enum PaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Refunded = 'Refunded',
}

export enum NotificationType {
  BookingReceived = 'BookingReceived',
  BookingApproved = 'BookingApproved',
  BookingRejected = 'BookingRejected',
  RideCancelled = 'RideCancelled',
  RideReminder = 'RideReminder',
}

export enum ReportReason {
  InappropriateBehavior = 'InappropriateBehavior',
  Fraud = 'Fraud',
  SafetyConcern = 'SafetyConcern',
  Spam = 'Spam',
  Other = 'Other',
}

export enum ReportTargetType {
  User = 'User',
  Ride = 'Ride',
}
