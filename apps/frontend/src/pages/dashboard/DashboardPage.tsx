import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BookingStatus } from '@wasslni/shared-types';
import { useAuthStore } from '@/store/auth.store';
import { useBookingsStore } from '@/store/bookings.store';
import { RideSearchForm } from '@/components/RideSearchForm';
import { RideCard } from '@/components/RideCard';
import { EmptyState } from '@/components/EmptyState';
import { Card } from '@/components/ui';
import { Button } from '@wasslni/shared-ui';
import { useCities } from '@/hooks/useCities';
import { formatDate } from '@/utils/format';
import { ridesApi } from '@/api/rides';
import { DEMO_RIDES } from '@/data/demo';
import type { RideWithDetails } from '@/data/demo';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const bookings = useBookingsStore((s) => s.bookings);
  const { data: cities = [] } = useCities();

  const { data: myRides = [] } = useQuery({
    queryKey: ['rides', 'mine'],
    queryFn: async () => {
      try {
        const { data } = await ridesApi.getMine();
        return data.length > 0 ? (data as RideWithDetails[]) : DEMO_RIDES.slice(0, 2) as RideWithDetails[];
      } catch {
        return DEMO_RIDES.slice(0, 2) as RideWithDetails[];
      }
    },
  });

  const upcoming = bookings
    .filter((b) => b.status === BookingStatus.Pending || b.status === BookingStatus.Accepted)
    .slice(0, 3);

  const recentRides = myRides.slice(0, 2);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {t('user.dashboardTitle', { name: user?.fullName ?? '' })}
          </h2>
          <p className="text-slate-600">{t('user.dashboardSubtitle')}</p>
        </div>
        <Link to="/app/create-ride">
          <Button>{t('user.createRide')}</Button>
        </Link>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold">{t('user.quickSearch')}</h3>
        <RideSearchForm cities={cities} compact />
      </Card>

      <div>
        <h3 className="mb-4 font-semibold">{t('user.myRides')}</h3>
        {recentRides.length === 0 ? (
          <EmptyState
            title={t('user.noRides')}
            description={t('user.createFirst')}
            actionLabel={t('user.createRide')}
            actionTo="/app/create-ride"
          />
        ) : (
          <div className="space-y-4">
            {recentRides.map((ride) => (
              <RideCard key={ride._id} ride={ride} />
            ))}
            <Link to="/app/my-rides">
              <Button variant="ghost" className="w-full">{t('common.viewAll')}</Button>
            </Link>
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">{t('user.upcomingBookings')}</h3>
          <Link to="/app/bookings">
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
