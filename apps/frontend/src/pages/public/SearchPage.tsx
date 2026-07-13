import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RideSearchForm } from '@/components/RideSearchForm';
import { RideCard } from '@/components/RideCard';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/ui';
import { useCities } from '@/hooks/useCities';
import { useRides } from '@/hooks/useRides';

export function SearchPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const params = {
    departureCityId: searchParams.get('from') ?? undefined,
    destinationCityId: searchParams.get('to') ?? undefined,
    date: searchParams.get('date') ?? undefined,
  };

  const { data: cities = [], isLoading: citiesLoading } = useCities();
  const { data: rides = [], isLoading: ridesLoading } = useRides(params);

  const hasSearch = params.departureCityId || params.destinationCityId || params.date;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('search.title')}</h1>
        <p className="mt-1 text-slate-600">{t('search.subtitle')}</p>
      </div>

      {citiesLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <RideSearchForm cities={cities} initialValues={params} />
      )}

      <div className="mt-8">
        {ridesLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : rides.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-600">
              {t('search.results', { count: rides.length })}
            </p>
            {rides.map((ride) => (
              <RideCard key={ride._id} ride={ride} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🚗"
            title={t('search.noResults')}
            description={
              hasSearch ? t('search.noResultsHint') : t('search.subtitle')
            }
            actionLabel={t('nav.home')}
            actionTo="/"
          />
        )}
      </div>
    </div>
  );
}
