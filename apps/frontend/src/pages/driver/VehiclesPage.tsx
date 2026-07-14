import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@wasslni/shared-ui';
import { Card, Input, Alert, Spinner } from '@/components/ui';
import { vehiclesApi } from '@/api/vehicles';
import apiClient from '@/api/client';
import type { Vehicle } from '@wasslni/shared-types';

const schema = z.object({
  brand: z.string().min(1),
  vehicleModel: z.string().min(1),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  color: z.string().min(1),
  licensePlate: z.string().min(1),
  seats: z.number().min(1).max(9),
});
type FormData = z.infer<typeof schema>;

export function VehiclesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', 'mine'],
    queryFn: () => vehiclesApi.getMine().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles', 'mine'] }); reset(); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: vehiclesApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles', 'mine'] }),
  });

  const photoInputRef = useRef<Record<string, HTMLInputElement | null>>({});

  const uploadVehiclePhoto = async (vehicleId: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    await apiClient.post(`/vehicles/${vehicleId}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    queryClient.invalidateQueries({ queryKey: ['vehicles', 'mine'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('driver.vehicles')}</h2>
        <Button onClick={() => setShowForm(!showForm)}>{t('driver.addVehicle')}</Button>
      </div>

      {showForm && (
        <Card>
          <h3 className="mb-4 font-semibold">{t('driver.addVehicle')}</h3>
          {createMutation.isError && <Alert variant="error">{t('common.error')}</Alert>}
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label={t('driver.vehicleBrand')} error={errors.brand?.message} {...register('brand')} />
              <Input label={t('driver.vehicleModel')} error={errors.vehicleModel?.message} {...register('vehicleModel')} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input type="number" label={t('driver.vehicleYear')} error={errors.year?.message} {...register('year', { valueAsNumber: true })} />
              <Input label={t('driver.vehicleColor')} error={errors.color?.message} {...register('color')} />
              <Input type="number" label={t('driver.vehicleSeats')} error={errors.seats?.message} {...register('seats', { valueAsNumber: true })} />
            </div>
            <Input label={t('driver.vehiclePlate')} error={errors.licensePlate?.message} {...register('licensePlate')} />
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>{t('common.save')}</Button>
              <Button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 text-slate-700 hover:bg-slate-200">{t('common.cancel')}</Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : vehicles.length === 0 && !showForm ? (
        <Card><p className="text-center text-slate-500">{t('driver.noVehicles')}</p></Card>
      ) : (
        <div className="space-y-4">
          {vehicles.map((v: Vehicle & { photoUrl?: string }) => (
            <Card key={v._id}>
              <div className="flex items-start gap-4">
                {v.photoUrl ? (
                  <img src={v.photoUrl} alt={v.brand} className="h-20 w-28 rounded-lg object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="h-20 w-28 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">🚗</div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{v.brand} {v.vehicleModel} · {v.year}</p>
                      <p className="text-sm text-slate-500">{v.color} · {v.licensePlate} · {v.seats} {t('ride.seats')}</p>
                    </div>
                    <button onClick={() => deleteMutation.mutate(v._id)} disabled={deleteMutation.isPending} className="text-sm text-red-500 hover:text-red-700 shrink-0">
                      {t('common.delete')}
                    </button>
                  </div>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      ref={(el) => { photoInputRef.current[v._id] = el; }}
                      onChange={(e) => e.target.files?.[0] && uploadVehiclePhoto(v._id, e.target.files[0])}
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current[v._id]?.click()}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      {v.photoUrl ? t('profile.changePhoto') : t('profile.addCarPhoto')}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
