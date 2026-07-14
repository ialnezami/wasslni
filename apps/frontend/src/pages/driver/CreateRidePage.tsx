import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@wasslni/shared-ui';
import { CitySelect } from '@/components/CitySelect';
import { Input, Card, Alert, Select } from '@/components/ui';
import { useCities } from '@/hooks/useCities';
import { vehiclesApi } from '@/api/vehicles';
import { ridesApi } from '@/api/rides';
import { recurringTripsApi } from '@/api/recurringTrips';

const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6];

const baseSchema = {
  vehicleId: z.string().min(1),
  departureCityId: z.string().min(1),
  destinationCityId: z.string().min(1),
  departurePoint: z.string().min(2),
  departureTime: z.string().min(1),
  price: z.number().min(1),
  totalSeats: z.number().min(1).max(8),
  description: z.string().optional(),
};

const oneOffSchema = z.object({ ...baseSchema, date: z.string().min(1) });
const recurringSchema = z.object({
  ...baseSchema,
  recurrenceType: z.enum(['daily', 'weekdays']),
  recurrenceDays: z.array(z.number()).optional(),
});

type OneOffForm = z.infer<typeof oneOffSchema>;
type RecurringForm = z.infer<typeof recurringSchema>;

export function CreateRidePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: cities = [] } = useCities();
  const [isRecurring, setIsRecurring] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', 'mine'],
    queryFn: () => vehiclesApi.getMine().then((r) => r.data),
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const oneOffForm = useForm<OneOffForm>({
    resolver: zodResolver(oneOffSchema),
    defaultValues: {
      vehicleId: '',
      departureCityId: '',
      destinationCityId: '',
      date: tomorrow.toISOString().split('T')[0],
      departureTime: '08:00',
      totalSeats: 3,
    },
  });

  const recurringForm = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      vehicleId: '',
      departureCityId: '',
      destinationCityId: '',
      departureTime: '08:00',
      totalSeats: 3,
      recurrenceType: 'daily',
      recurrenceDays: [],
    },
  });

  const oneOffMutation = useMutation({
    mutationFn: ridesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      navigate('/app/my-rides');
    },
    onError: () => oneOffForm.setError('root', { message: t('common.error') }),
  });

  const recurringMutation = useMutation({
    mutationFn: recurringTripsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-trips', 'mine'] });
      navigate('/app/my-rides');
    },
    onError: () => recurringForm.setError('root', { message: t('common.error') }),
  });

  if (vehicles.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <h2 className="text-xl font-semibold">{t('user.createRide')}</h2>
        <Alert variant="info">{t('driver.noVehiclesHint')}</Alert>
        <Button onClick={() => navigate('/app/vehicles')}>{t('user.addVehicle')}</Button>
      </div>
    );
  }

  const recurrenceType = recurringForm.watch('recurrenceType');
  const recurrenceDays = recurringForm.watch('recurrenceDays') ?? [];

  function toggleDay(day: number) {
    const next = recurrenceDays.includes(day)
      ? recurrenceDays.filter((d) => d !== day)
      : [...recurrenceDays, day];
    recurringForm.setValue('recurrenceDays', next);
  }

  function submitRecurring(data: RecurringForm) {
    const days = data.recurrenceType === 'daily' ? [] : (data.recurrenceDays ?? []);
    recurringMutation.mutate({
      vehicleId: data.vehicleId,
      departureCityId: data.departureCityId,
      destinationCityId: data.destinationCityId,
      departurePoint: data.departurePoint,
      departureTime: data.departureTime,
      price: data.price,
      totalSeats: data.totalSeats,
      description: data.description,
      recurrence: { type: data.recurrenceType, days },
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h2 className="text-xl font-semibold">{t('user.createRide')}</h2>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="h-4 w-4 accent-emerald-600"
        />
        <span className="font-medium text-slate-700">🔁 {t('recurring.toggle')}</span>
      </label>

      <Card>
        {!isRecurring ? (
          <form onSubmit={oneOffForm.handleSubmit((d) => oneOffMutation.mutate(d))} className="space-y-4">
            {oneOffMutation.isError && <Alert variant="error">{t('common.error')}</Alert>}

            <Select
              label={t('driver.selectVehicle')}
              error={oneOffForm.formState.errors.vehicleId?.message}
              {...oneOffForm.register('vehicleId')}
            >
              <option value="">{t('driver.selectVehicle')}</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.brand} {v.vehicleModel} ({v.licensePlate})
                </option>
              ))}
            </Select>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={oneOffForm.control}
                name="departureCityId"
                render={({ field }) => (
                  <CitySelect
                    label={t('search.from')}
                    placeholder={t('search.selectCity')}
                    name="departureCityId"
                    cities={cities}
                    value={field.value}
                    onChange={field.onChange}
                    error={oneOffForm.formState.errors.departureCityId?.message}
                  />
                )}
              />
              <Controller
                control={oneOffForm.control}
                name="destinationCityId"
                render={({ field }) => (
                  <CitySelect
                    label={t('search.to')}
                    placeholder={t('search.selectCity')}
                    name="destinationCityId"
                    cities={cities}
                    value={field.value}
                    onChange={field.onChange}
                    error={oneOffForm.formState.errors.destinationCityId?.message}
                  />
                )}
              />
            </div>

            <Input label={t('ride.departure')} error={oneOffForm.formState.errors.departurePoint?.message} {...oneOffForm.register('departurePoint')} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="date" label={t('search.date')} error={oneOffForm.formState.errors.date?.message} {...oneOffForm.register('date')} />
              <Input type="time" label={t('ride.time')} error={oneOffForm.formState.errors.departureTime?.message} {...oneOffForm.register('departureTime')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="number" label={t('ride.price')} error={oneOffForm.formState.errors.price?.message} {...oneOffForm.register('price', { valueAsNumber: true })} />
              <Input type="number" label={t('ride.seats')} error={oneOffForm.formState.errors.totalSeats?.message} {...oneOffForm.register('totalSeats', { valueAsNumber: true })} />
            </div>

            <Input label={t('ride.description')} {...oneOffForm.register('description')} />
            <Button type="submit" disabled={oneOffMutation.isPending} className="w-full py-3">{t('common.save')}</Button>
          </form>
        ) : (
          <form onSubmit={recurringForm.handleSubmit(submitRecurring)} className="space-y-4">
            {recurringMutation.isError && <Alert variant="error">{t('common.error')}</Alert>}

            <Select
              label={t('driver.selectVehicle')}
              error={recurringForm.formState.errors.vehicleId?.message}
              {...recurringForm.register('vehicleId')}
            >
              <option value="">{t('driver.selectVehicle')}</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.brand} {v.vehicleModel} ({v.licensePlate})
                </option>
              ))}
            </Select>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={recurringForm.control}
                name="departureCityId"
                render={({ field }) => (
                  <CitySelect
                    label={t('search.from')}
                    placeholder={t('search.selectCity')}
                    name="departureCityId"
                    cities={cities}
                    value={field.value}
                    onChange={field.onChange}
                    error={recurringForm.formState.errors.departureCityId?.message}
                  />
                )}
              />
              <Controller
                control={recurringForm.control}
                name="destinationCityId"
                render={({ field }) => (
                  <CitySelect
                    label={t('search.to')}
                    placeholder={t('search.selectCity')}
                    name="destinationCityId"
                    cities={cities}
                    value={field.value}
                    onChange={field.onChange}
                    error={recurringForm.formState.errors.destinationCityId?.message}
                  />
                )}
              />
            </div>

            <Input label={t('ride.departure')} error={recurringForm.formState.errors.departurePoint?.message} {...recurringForm.register('departurePoint')} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="time" label={t('ride.time')} error={recurringForm.formState.errors.departureTime?.message} {...recurringForm.register('departureTime')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input type="number" label={t('ride.price')} error={recurringForm.formState.errors.price?.message} {...recurringForm.register('price', { valueAsNumber: true })} />
              <Input type="number" label={t('ride.seats')} error={recurringForm.formState.errors.totalSeats?.message} {...recurringForm.register('totalSeats', { valueAsNumber: true })} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t('recurring.recurrenceType')}</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" value="daily" {...recurringForm.register('recurrenceType')} />
                  {t('recurring.daily')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" value="weekdays" {...recurringForm.register('recurrenceType')} />
                  {t('recurring.weekdays')}
                </label>
              </div>
            </div>

            {recurrenceType === 'weekdays' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">{t('recurring.selectDays')}</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_INDICES.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        recurrenceDays.includes(day)
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 text-slate-600 hover:border-emerald-400'
                      }`}
                    >
                      {t(`recurring.days.${day}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Input label={t('ride.description')} {...recurringForm.register('description')} />
            <Button type="submit" disabled={recurringMutation.isPending} className="w-full py-3">{t('common.save')}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
