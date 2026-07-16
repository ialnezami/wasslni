import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@wasslni/shared-ui';
import { CitySelect } from '@/components/CitySelect';
import { Input, Card, Alert, Select, Spinner } from '@/components/ui';
import { useCities } from '@/hooks/useCities';
import { vehiclesApi } from '@/api/vehicles';
import { ridesApi } from '@/api/rides';
import { bookingsApi } from '@/api/bookings';
import { BookingStatus } from '@wasslni/shared-types';

const editRideSchema = z.object({
  vehicleId: z.string().min(1),
  departureCityId: z.string().min(1),
  destinationCityId: z.string().min(1),
  departurePoint: z.string().min(2),
  date: z.string().min(1),
  departureTime: z.string().min(1),
  price: z.number().min(1),
  description: z.string().optional(),
});

type EditRideForm = z.infer<typeof editRideSchema>;

export function EditRidePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: cities = [] } = useCities();

  const { data: ride, isLoading: rideLoading } = useQuery({
    queryKey: ['rides', id],
    queryFn: () => ridesApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', 'ride', id],
    queryFn: () => bookingsApi.forRide(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', 'mine'],
    queryFn: () => vehiclesApi.getMine().then((r) => r.data),
  });

  const form = useForm<EditRideForm>({
    resolver: zodResolver(editRideSchema),
    values: ride
      ? {
          vehicleId: ride.vehicleId,
          departureCityId: ride.departureCityId,
          destinationCityId: ride.destinationCityId,
          departurePoint: ride.departurePoint,
          date: ride.date,
          departureTime: ride.departureTime,
          price: ride.price,
          description: ride.description ?? '',
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditRideForm) =>
      ridesApi.update(id!, { ...data, description: data.description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides', 'mine'] });
      navigate('/app/my-rides');
    },
    onError: () => form.setError('root', { message: t('common.error') }),
  });

  if (rideLoading || bookingsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const hasAcceptedBookings = bookings.some((b) => b.status === BookingStatus.Accepted);

  if (hasAcceptedBookings) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h2 className="text-xl font-semibold">{t('driver.editRide')}</h2>
        <Alert variant="error">{t('driver.editRideBlocked')}</Alert>
        <Button variant="ghost" onClick={() => navigate('/app/my-rides')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h2 className="text-xl font-semibold">{t('driver.editRide')}</h2>
      <Card>
        <form
          onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))}
          className="space-y-4"
        >
          {form.formState.errors.root && (
            <Alert variant="error">{form.formState.errors.root.message}</Alert>
          )}

          <Select
            label={t('driver.selectVehicle')}
            error={form.formState.errors.vehicleId?.message}
            {...form.register('vehicleId')}
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
              control={form.control}
              name="departureCityId"
              render={({ field }) => (
                <CitySelect
                  label={t('search.from')}
                  placeholder={t('search.selectCity')}
                  name="departureCityId"
                  cities={cities}
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.departureCityId?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name="destinationCityId"
              render={({ field }) => (
                <CitySelect
                  label={t('search.to')}
                  placeholder={t('search.selectCity')}
                  name="destinationCityId"
                  cities={cities}
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.destinationCityId?.message}
                />
              )}
            />
          </div>

          <Input
            label={t('ride.departure')}
            error={form.formState.errors.departurePoint?.message}
            {...form.register('departurePoint')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="date"
              label={t('search.date')}
              error={form.formState.errors.date?.message}
              {...form.register('date')}
            />
            <Input
              type="time"
              label={t('ride.time')}
              error={form.formState.errors.departureTime?.message}
              {...form.register('departureTime')}
            />
          </div>

          <Input
            type="number"
            label={t('ride.price')}
            error={form.formState.errors.price?.message}
            {...form.register('price', { valueAsNumber: true })}
          />

          <Input label={t('ride.description')} {...form.register('description')} />

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full py-3"
          >
            {t('common.save')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
