import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@wasslni/shared-ui';
import { CitySelect } from '@/components/CitySelect';
import { DatePickerCalendar } from '@/components/DatePickerCalendar';
import { ridesApi } from '@/api/rides';
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

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [fromCity, setFromCity] = useState(initialValues?.departureCityId ?? '');
  const [toCity, setToCity] = useState(initialValues?.destinationCityId ?? '');
  const [date, setDate] = useState(initialValues?.date ?? defaultDate);

  // Fetch available dates for the chosen route so we can show pins on the calendar
  const { data: routeRides = [] } = useQuery({
    queryKey: ['rides', 'route-dates', fromCity, toCity],
    queryFn: async () => {
      if (!fromCity || !toCity) return [];
      try {
        const { data } = await ridesApi.search({ departureCityId: fromCity, destinationCityId: toCity });
        return data;
      } catch {
        return [];
      }
    },
    enabled: Boolean(fromCity && toCity),
    staleTime: 60_000,
  });

  const highlightedDates: string[] = [...new Set(routeRides.map((r: { date: string }) => r.date))];

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (fromCity) params.set('from', fromCity);
    if (toCity) params.set('to', toCity);
    if (date) params.set('date', date);
    navigate(`/search?${params.toString()}`);
  }, [fromCity, toCity, date, navigate]);

  const today = new Date().toISOString().split('T')[0];

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
        <CitySelect
          name="departureCityId"
          cities={cities}
          label={t('search.from')}
          placeholder={t('search.selectCity')}
          value={fromCity}
          onChange={setFromCity}
        />
        <CitySelect
          name="destinationCityId"
          cities={cities}
          label={t('search.to')}
          placeholder={t('search.selectCity')}
          value={toCity}
          onChange={setToCity}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{t('search.date')}</label>
          <input
            type="date"
            name="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full py-3 text-base">{t('search.submit')}</Button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
    >
      <h2 className="mb-5 text-lg font-semibold text-slate-900">{t('search.formTitle')}</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <CitySelect
          name="departureCityId"
          cities={cities}
          label={t('search.from')}
          placeholder={t('search.selectCity')}
          value={fromCity}
          onChange={setFromCity}
        />
        <CitySelect
          name="destinationCityId"
          cities={cities}
          label={t('search.to')}
          placeholder={t('search.selectCity')}
          value={toCity}
          onChange={setToCity}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
        <DatePickerCalendar
          value={date}
          onChange={setDate}
          highlightedDates={highlightedDates}
          minDate={today}
          name="date"
        />

        <div className="flex items-end">
          <Button type="submit" className="w-full px-8 py-3 text-base md:w-auto">
            {t('search.submit')}
          </Button>
        </div>
      </div>
    </form>
  );
}
