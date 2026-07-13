import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookingStatus } from '@wasslni/shared-types';
import { useAuthStore } from '@/store/auth.store';
import { useBookingsStore } from '@/store/bookings.store';
import { RideSearchForm } from '@/components/RideSearchForm';
import { Card } from '@/components/ui';
import { useCities } from '@/hooks/useCities';
import { formatDate } from '@/utils/format';
import { Button } from '@wasslni/shared-ui';

export function PassengerDashboardPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const bookings = useBookingsStore((s) => s.bookings);
  const { data: cities = [] } = useCities();

  const upcoming = bookings
    .filter((b) => b.status === BookingStatus.Pending || b.status === BookingStatus.Accepted)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {t('passenger.dashboardTitle', { name: user?.fullName ?? '' })}
        </h2>
        <p className="text-slate-600">{t('passenger.dashboardSubtitle')}</p>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold">{t('passenger.quickSearch')}</h3>
        <RideSearchForm cities={cities} compact />
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">{t('passenger.upcomingBookings')}</h3>
          <Link to="/passenger/bookings">
            <Button variant="ghost">{t('common.viewAll')}</Button>
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <Card className="text-center text-slate-600">
            <p>{t('booking.empty')}</p>
            <Link to="/search" className="mt-4 inline-block">
              <Button>{t('nav.search')}</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => (
              <Card key={b.id} padding="sm">
                <p className="font-medium">
                  {b.ride.departureCityName} → {b.ride.destinationCityName}
                </p>
                <p className="text-sm text-slate-600">
                  {formatDate(b.ride.date, i18n.language)} · {t(`booking.status.${b.status}`)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
