import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { RideCard } from '@/components/RideCard';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@wasslni/shared-ui';
import { ridesApi } from '@/api/rides';
import { DEMO_RIDES } from '@/data/demo';
import type { RideWithDetails } from '@/data/demo';

export function DriverDashboardPage() {
  const { t } = useTranslation();

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

  const recent = myRides.slice(0, 2);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('driver.dashboardTitle')}</h2>
          <p className="text-slate-600">{t('driver.dashboardSubtitle')}</p>
        </div>
        <Link to="/driver/rides/new">
          <Button>{t('driver.createRide')}</Button>
        </Link>
      </div>

      <div>
        <h3 className="mb-4 font-semibold">{t('driver.publishedRides')}</h3>
        {recent.length === 0 ? (
          <EmptyState title={t('driver.noRides')} description={t('driver.createFirst')} actionLabel={t('driver.createRide')} actionTo="/driver/rides/new" />
        ) : (
          <div className="space-y-4">
            {recent.map((ride) => (
              <RideCard key={ride._id} ride={ride} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
