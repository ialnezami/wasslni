import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BookingStatus } from '@wasslni/shared-types';
import { useAuthStore } from '@/store/auth.store';
import { useBookingsStore } from '@/store/bookings.store';
import { RideCard } from '@/components/RideCard';
import { RideSearchForm } from '@/components/RideSearchForm';
import { EmptyState } from '@/components/EmptyState';
import { Card, Spinner } from '@/components/ui';
import { Button } from '@wasslni/shared-ui';
import { formatDate } from '@/utils/format';
import { ridesApi } from '@/api/rides';
import { useCities } from '@/hooks/useCities';
import { useRides } from '@/hooks/useRides';
import { DEMO_RIDES } from '@/data/demo';
import type { RideWithDetails } from '@/data/demo';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const bookings = useBookingsStore((s) => s.bookings);
  const [searchParams] = useSearchParams();

  const searchQuery = {
    departureCityId: searchParams.get('from') ?? undefined,
    destinationCityId: searchParams.get('to') ?? undefined,
    date: searchParams.get('date') ?? undefined,
  };
  const hasSearch = !!(searchQuery.departureCityId || searchQuery.destinationCityId || searchQuery.date);

  const { data: cities = [], isLoading: citiesLoading } = useCities();
  const { data: searchResults = [], isLoading: searchLoading } = useRides(searchQuery);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('user.dashboardTitle', { name: user?.fullName ?? '' })}
          </h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{t('user.dashboardSubtitle')}</p>
        </div>
        <Link to="/app/create-ride">
          <Button>🚗 {t('user.offerTrip')}</Button>
        </Link>
      </div>

      {/* Search — primary feature */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">{t('user.searchTrip')}</h3>
        {citiesLoading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : (
          <RideSearchForm cities={cities} initialValues={searchQuery} />
        )}
      </div>

      {/* Search results */}
      {hasSearch && (
        <div>
          {searchLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t('search.results', { count: searchResults.length })}
              </p>
              {searchResults.map((ride) => (
                <RideCard key={ride._id} ride={ride as RideWithDetails} />
              ))}
            </div>
          ) : (
            <EmptyState icon="🚗" title={t('search.noResults')} description={t('search.noResultsHint')} />
          )}
        </div>
      )}

      {/* My rides preview — hidden when search results are showing */}
      {!hasSearch && (
        <>
          <div>
            <h3 className="mb-4 font-semibold dark:text-slate-100">{t('user.myRides')}</h3>
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
              <h3 className="font-semibold dark:text-slate-100">{t('user.upcomingBookings')}</h3>
              <Link to="/app/bookings">
                <Button variant="ghost">{t('common.viewAll')}</Button>
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <Card className="text-center text-slate-600 dark:text-slate-400">
                <p>{t('booking.empty')}</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <Card key={b.id} padding="sm">
                    <p className="font-medium dark:text-slate-100">
                      {b.ride.departureCityName} → {b.ride.destinationCityName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(b.ride.date, i18n.language)} · {t(`booking.status.${b.status}`)}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
