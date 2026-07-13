import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookingStatus } from '@wasslni/shared-types';
import { useBookingsStore } from '@/store/bookings.store';
import { formatDate, formatPrice } from '@/utils/format';
import { Card, Badge } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@wasslni/shared-ui';

const statusVariant: Record<BookingStatus, 'warning' | 'success' | 'danger' | 'default'> = {
  [BookingStatus.Pending]: 'warning',
  [BookingStatus.Accepted]: 'success',
  [BookingStatus.Rejected]: 'danger',
  [BookingStatus.Cancelled]: 'default',
};

export function BookingsPage() {
  const { t, i18n } = useTranslation();
  const bookings = useBookingsStore((s) => s.bookings);
  const cancelBooking = useBookingsStore((s) => s.cancelBooking);

  const activeBookings = bookings.filter((b) => b.status !== BookingStatus.Cancelled);

  if (activeBookings.length === 0) {
    return (
      <EmptyState
        title={t('booking.empty')}
        description={t('booking.emptyHint')}
        actionLabel={t('nav.search')}
        actionTo="/search"
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t('booking.title')}</h2>
      {activeBookings.map((booking) => (
        <Card key={booking.id}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge variant={statusVariant[booking.status]}>
                {t(`booking.status.${booking.status}`)}
              </Badge>
              <h3 className="mt-2 font-semibold text-slate-900">
                {booking.ride.departureCityName} → {booking.ride.destinationCityName}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {formatDate(booking.ride.date, i18n.language)} · {booking.ride.departureTime}
              </p>
              <p className="text-sm text-slate-500">
                {t('booking.seats', { count: booking.seats })} ·{' '}
                {formatPrice(booking.ride.price * booking.seats, i18n.language)}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={`/rides/${booking.rideId}`}>
                <Button variant="secondary">{t('ride.viewDetails')}</Button>
              </Link>
              {booking.status === BookingStatus.Pending && (
                <Button variant="ghost" onClick={() => cancelBooking(booking.id)}>
                  {t('booking.cancel')}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
