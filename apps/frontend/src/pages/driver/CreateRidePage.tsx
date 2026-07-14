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

const schema = z.object({
  vehicleId: z.string().min(1),
  departureCityId: z.string().min(1),
  destinationCityId: z.string().min(1),
  departurePoint: z.string().min(2),
  date: z.string().min(1),
  departureTime: z.string().min(1),
  price: z.number().min(1),
  totalSeats: z.number().min(1).max(8),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CreateRidePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: cities = [] } = useCities();
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', 'mine'],
    queryFn: () => vehiclesApi.getMine().then((r) => r.data),
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { register, handleSubmit, control, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: '',
      departureCityId: '',
      destinationCityId: '',
      date: tomorrow.toISOString().split('T')[0],
      departureTime: '08:00',
      totalSeats: 3,
    },
  });

  const mutation = useMutation({
    mutationFn: ridesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      navigate('/app/my-rides');
    },
    onError: () => setError('root', { message: t('common.error') }),
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

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h2 className="text-xl font-semibold">{t('user.createRide')}</h2>
      <Card>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {mutation.isError && <Alert variant="error">{t('common.error')}</Alert>}

          <Select label={t('driver.selectVehicle')} error={errors.vehicleId?.message} {...register('vehicleId')}>
            <option value="">{t('driver.selectVehicle')}</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>{v.brand} {v.vehicleModel} · {v.licensePlate}</option>
            ))}
          </Select>

          <Controller name="departureCityId" control={control} render={({ field }) => (
            <CitySelect name="departureCityId" cities={cities} label={t('search.from')} placeholder={t('search.selectCity')} value={field.value} onChange={field.onChange} error={errors.departureCityId?.message} />
          )} />
          <Controller name="destinationCityId" control={control} render={({ field }) => (
            <CitySelect name="destinationCityId" cities={cities} label={t('search.to')} placeholder={t('search.selectCity')} value={field.value} onChange={field.onChange} error={errors.destinationCityId?.message} />
          )} />

          <Input label={t('ride.departure')} error={errors.departurePoint?.message} {...register('departurePoint')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="date" label={t('search.date')} error={errors.date?.message} {...register('date')} />
            <Input type="time" label={t('ride.time')} error={errors.departureTime?.message} {...register('departureTime')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input type="number" label={t('ride.price')} error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
            <Input type="number" label={t('ride.seats')} error={errors.totalSeats?.message} {...register('totalSeats', { valueAsNumber: true })} />
          </div>
          <Input label={t('ride.description')} {...register('description')} />

          <Button type="submit" disabled={mutation.isPending} className="w-full py-3">{t('common.save')}</Button>
        </form>
      </Card>
    </div>
  );
}
