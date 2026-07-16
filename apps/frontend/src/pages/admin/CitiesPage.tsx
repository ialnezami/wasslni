import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@wasslni/shared-ui';
import { Card, Input, Spinner, Alert, Badge } from '@/components/ui';
import { citiesApi, type CityPayload } from '@/api/cities';
import type { City } from '@wasslni/shared-types';

const citySchema = z.object({
  nameAr: z.string().min(1).max(100),
  nameFr: z.string().min(1).max(100),
  nameEn: z.string().max(100).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

type CityForm = z.infer<typeof citySchema>;

function CityFormFields({
  form,
  isPending,
}: {
  form: ReturnType<typeof useForm<CityForm>>;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t('admin.cityNameAr')}
          error={form.formState.errors.nameAr?.message}
          {...form.register('nameAr')}
        />
        <Input
          label={t('admin.cityNameFr')}
          error={form.formState.errors.nameFr?.message}
          {...form.register('nameFr')}
        />
      </div>
      <Input
        label={t('admin.cityNameEn')}
        error={form.formState.errors.nameEn?.message}
        {...form.register('nameEn')}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="number"
          step="any"
          label="Latitude"
          error={form.formState.errors.lat?.message}
          {...form.register('lat', { valueAsNumber: true })}
        />
        <Input
          type="number"
          step="any"
          label="Longitude"
          error={form.formState.errors.lng?.message}
          {...form.register('lng', { valueAsNumber: true })}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending} className="px-4 py-2 text-sm">
          {t('common.save')}
        </Button>
        <Button type="reset" variant="ghost" className="px-4 py-2 text-sm">
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}

function AddCityForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const form = useForm<CityForm>({ resolver: zodResolver(citySchema) });

  const mutation = useMutation({
    mutationFn: (dto: CityPayload) => citiesApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cities'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      form.reset();
      onSuccess();
    },
    onError: () => form.setError('root', { message: t('common.error') }),
  });

  return (
    <Card>
      <form
        onSubmit={form.handleSubmit((d) =>
          mutation.mutate({ ...d, nameEn: d.nameEn || undefined }),
        )}
        onReset={() => {
          form.reset();
          onSuccess();
        }}
        className="space-y-3"
      >
        {mutation.isError && <Alert variant="error">{t('common.error')}</Alert>}
        <CityFormFields form={form} isPending={mutation.isPending} />
      </form>
    </Card>
  );
}

function CityRow({ city }: { city: City }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const form = useForm<CityForm>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      nameAr: city.nameAr,
      nameFr: city.nameFr,
      nameEn: city.nameEn ?? '',
      lat: city.lat,
      lng: city.lng,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (dto: Partial<CityPayload>) => citiesApi.update(city._id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cities'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      setEditing(false);
    },
    onError: () => form.setError('root', { message: t('common.error') }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => citiesApi.remove(city._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cities'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] });
    },
  });

  if (editing) {
    return (
      <Card>
        <form
          onSubmit={form.handleSubmit((d) =>
            updateMutation.mutate({ ...d, nameEn: d.nameEn || undefined }),
          )}
          onReset={() => setEditing(false)}
          className="space-y-3"
        >
          {updateMutation.isError && <Alert variant="error">{t('common.error')}</Alert>}
          <CityFormFields form={form} isPending={updateMutation.isPending} />
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">
            {city.nameAr} · {city.nameFr}
            {city.nameEn ? ` · ${city.nameEn}` : ''}
          </p>
          <p className="text-sm text-slate-500">
            {city.lat}, {city.lng}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!city.isActive && <Badge variant="default">Inactive</Badge>}
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
          >
            {t('admin.editCity')}
          </button>
          <button
            onClick={() => {
              if (window.confirm(t('common.confirmDelete'))) deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
            className="rounded-lg border border-red-100 px-3 py-1 text-sm text-red-500 hover:bg-red-50"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </Card>
  );
}

export function CitiesPage() {
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);

  const { data: cities = [], isLoading } = useQuery<City[]>({
    queryKey: ['admin', 'cities'],
    queryFn: () => citiesApi.getAll().then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('admin.cities')}</h2>
        <Button onClick={() => setShowAdd((v) => !v)} className="px-4 py-2 text-sm">
          {t('admin.addCity')}
        </Button>
      </div>

      {showAdd && <AddCityForm onSuccess={() => setShowAdd(false)} />}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : cities.length === 0 ? (
        <p className="text-center text-slate-500">{t('admin.noCities')}</p>
      ) : (
        <div className="space-y-3">
          {cities.map((city) => (
            <CityRow key={city._id} city={city} />
          ))}
        </div>
      )}
    </div>
  );
}
