import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@wasslni/shared-ui';
import { RideCard } from '@/components/RideCard';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/ui';
import { ridesApi } from '@/api/rides';
import { DEMO_RIDES } from '@/data/demo';
import type { RideWithDetails } from '@/data/demo';

export function MyRidesPage() {
  const { t } = useTranslation();

  const { data: rides = [], isLoading } = useQuery({
    queryKey: ['rides', 'mine'],
    queryFn: async () => {
      try {
        const { data } = await ridesApi.getMine();
        return data.length > 0 ? (data as RideWithDetails[]) : (DEMO_RIDES.slice(0, 2) as RideWithDetails[]);
      } catch {
        return DEMO_RIDES.slice(0, 2) as RideWithDetails[];
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('driver.myRides')}</h2>
        <Link to="/driver/rides/new"><Button>{t('driver.createRide')}</Button></Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : rides.length === 0 ? (
        <EmptyState title={t('driver.noRides')} description={t('driver.createFirst')} actionLabel={t('driver.createRide')} actionTo="/driver/rides/new" />
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => <RideCard key={ride._id} ride={ride} />)}
        </div>
      )}
    </div>
  );
}
