import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@wasslni/shared-ui';
import { CitySelect } from '@/components/CitySelect';
import { Input } from '@/components/ui';
import type { City } from '@wasslni/shared-types';

export interface RideSearchValues {
  departureCityId: string;
  destinationCityId: string;
  date: string;
}

interface RideSearchFormProps {
  cities: City[];
  initialValues?: Partial<RideSearchValues>;
  compact?: boolean;
}

export function RideSearchForm({ cities, initialValues, compact = false }: RideSearchFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    const departureCityId = formData.get('departureCityId') as string;
    const destinationCityId = formData.get('destinationCityId') as string;
    const date = formData.get('date') as string;

    if (departureCityId) params.set('from', departureCityId);
    if (destinationCityId) params.set('to', destinationCityId);
    if (date) params.set('date', date);

    navigate(`/search?${params.toString()}`);
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? 'grid gap-4 md:grid-cols-4'
          : 'grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 md:p-6 lg:grid-cols-4'
      }
    >
      {!compact && (
        <h2 className="text-lg font-semibold text-slate-900 md:col-span-2 lg:col-span-4">
          {t('search.formTitle')}
        </h2>
      )}

      <CitySelect
        name="departureCityId"
        cities={cities}
        label={t('search.from')}
        placeholder={t('search.selectCity')}
        defaultValue={initialValues?.departureCityId}
      />

      <CitySelect
        name="destinationCityId"
        cities={cities}
        label={t('search.to')}
        placeholder={t('search.selectCity')}
        defaultValue={initialValues?.destinationCityId}
      />

      <Input
        type="date"
        name="date"
        label={t('search.date')}
        defaultValue={initialValues?.date ?? defaultDate}
        min={new Date().toISOString().split('T')[0]}
      />

      <div className="flex items-end">
        <Button type="submit" className="w-full py-3 text-base">
          {t('search.submit')}
        </Button>
      </div>
    </form>
  );
}
