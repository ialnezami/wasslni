# Driver EditRide + Admin Cities CRUD — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Driver EditRide page (pre-filled form, blocked if accepted bookings exist) and a fully functional Admin Cities CRUD page (inline add/edit/delete).

**Architecture:** Pure frontend work — all backend endpoints already exist and are guarded. Two new page components, minor API extensions, i18n key additions, and route/navigation wiring. No backend changes required.

**Tech Stack:** React, React Router v6, React Query, React Hook Form + Zod, TailwindCSS (RTL logical props), i18next, Axios

## Global Constraints

- RTL support: use Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`) — never `ml-`/`mr-`/`pl-`/`pr-`
- All user-facing strings via `useTranslation()` — never hardcoded text
- Follow existing component patterns: `Card`, `Input`, `Select`, `Alert`, `Button`, `Spinner`, `Badge` from `@/components/ui` and `@wasslni/shared-ui`
- No backend changes — all endpoints (`PATCH /rides/:id`, `GET /bookings/ride/:rideId`, `POST /cities`, `PATCH /cities/:id`, `DELETE /cities/:id`) already exist

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/frontend/src/api/cities.ts` | Add create/update/remove methods |
| Modify | `apps/frontend/src/i18n/locales/ar.json` | Add new i18n keys (Arabic) |
| Modify | `apps/frontend/src/i18n/locales/en.json` | Add new i18n keys (English) |
| Modify | `apps/frontend/src/i18n/locales/fr.json` | Add new i18n keys (French) |
| Create | `apps/frontend/src/pages/admin/CitiesPage.tsx` | Admin cities CRUD page |
| Create | `apps/frontend/src/pages/driver/EditRidePage.tsx` | Driver edit ride page |
| Modify | `apps/frontend/src/pages/driver/MyRidesPage.tsx` | Add Edit button to scheduled ride cards |
| Modify | `apps/frontend/src/routes/index.tsx` | Wire up new routes |

---

## Task 1: Extend cities API and add i18n keys

**Files:**
- Modify: `apps/frontend/src/api/cities.ts`
- Modify: `apps/frontend/src/i18n/locales/ar.json`
- Modify: `apps/frontend/src/i18n/locales/en.json`
- Modify: `apps/frontend/src/i18n/locales/fr.json`

**Interfaces:**
- Produces: `citiesApi.create(dto)`, `citiesApi.update(id, dto)`, `citiesApi.remove(id)`
- Produces: i18n keys `driver.editRide`, `driver.editRideBlocked`, `driver.cancelRide`, `driver.cancelRideConfirm`, `driver.cancelReasonPlaceholder`, `driver.confirmCancel`, `driver.noVehiclesHint`, `admin.cities`, `admin.addCity`, `admin.editCity`, `admin.noCities`, `admin.cityNameAr`, `admin.cityNameFr`, `admin.cityNameEn`

- [ ] **Step 1: Extend citiesApi**

Replace the content of `apps/frontend/src/api/cities.ts`:

```ts
import apiClient from './client';
import type { City } from '@wasslni/shared-types';

export interface CityPayload {
  nameAr: string;
  nameFr: string;
  nameEn?: string;
  lat: number;
  lng: number;
}

export const citiesApi = {
  getAll: () => apiClient.get<City[]>('/cities'),
  create: (dto: CityPayload) => apiClient.post<City>('/cities', dto),
  update: (id: string, dto: Partial<CityPayload>) => apiClient.patch<City>(`/cities/${id}`, dto),
  remove: (id: string) => apiClient.delete(`/cities/${id}`),
};
```

- [ ] **Step 2: Add Arabic translations**

In `apps/frontend/src/i18n/locales/ar.json`, inside the `"driver"` object add these keys:

```json
"editRide": "تعديل الرحلة",
"editRideBlocked": "لا يمكن تعديل الرحلة — يوجد ركاب بحجوزات مؤكدة",
"cancelRide": "إلغاء الرحلة",
"cancelRideConfirm": "هل أنت متأكد من إلغاء هذه الرحلة؟",
"cancelReasonPlaceholder": "سبب الإلغاء (اختياري)",
"confirmCancel": "تأكيد الإلغاء",
"noVehiclesHint": "يجب إضافة مركبة أولاً قبل نشر رحلة"
```

Inside the `"admin"` object add:

```json
"cities": "المدن",
"addCity": "إضافة مدينة",
"editCity": "تعديل",
"noCities": "لا توجد مدن",
"cityNameAr": "الاسم بالعربية",
"cityNameFr": "الاسم بالفرنسية",
"cityNameEn": "الاسم بالإنجليزية (اختياري)",
"reports": "البلاغات",
"reviews": "التقييمات",
"reporter": "المُبلِّغ",
"reviewer": "المقيِّم",
"reviewee": "المُقيَّم",
"deleteReport": "حذف البلاغ",
"noReports": "لا توجد بلاغات",
"noReviews": "لا توجد تقييمات",
"banned": "محظور",
"banUser": "حظر المستخدم",
"unbanUser": "رفع الحظر"
```

- [ ] **Step 3: Add English translations**

In `apps/frontend/src/i18n/locales/en.json`, inside `"driver"` add:

```json
"editRide": "Edit Ride",
"editRideBlocked": "Cannot edit — passengers have confirmed bookings",
"cancelRide": "Cancel Ride",
"cancelRideConfirm": "Are you sure you want to cancel this ride?",
"cancelReasonPlaceholder": "Cancellation reason (optional)",
"confirmCancel": "Confirm Cancellation",
"noVehiclesHint": "You must add a vehicle before publishing a ride"
```

Inside `"admin"` add:

```json
"cities": "Cities",
"addCity": "Add City",
"editCity": "Edit",
"noCities": "No cities yet",
"cityNameAr": "Arabic Name",
"cityNameFr": "French Name",
"cityNameEn": "English Name (optional)",
"reports": "Reports",
"reviews": "Reviews",
"reporter": "Reporter",
"reviewer": "Reviewer",
"reviewee": "Reviewee",
"deleteReport": "Delete Report",
"noReports": "No reports",
"noReviews": "No reviews",
"banned": "Banned",
"banUser": "Ban User",
"unbanUser": "Unban User"
```

- [ ] **Step 4: Add French translations**

In `apps/frontend/src/i18n/locales/fr.json`, inside `"driver"` add:

```json
"editRide": "Modifier le trajet",
"editRideBlocked": "Modification impossible — des passagers ont des réservations confirmées",
"cancelRide": "Annuler le trajet",
"cancelRideConfirm": "Êtes-vous sûr de vouloir annuler ce trajet ?",
"cancelReasonPlaceholder": "Raison d'annulation (optionnelle)",
"confirmCancel": "Confirmer l'annulation",
"noVehiclesHint": "Vous devez d'abord ajouter un véhicule avant de publier un trajet"
```

Inside `"admin"` add:

```json
"cities": "Villes",
"addCity": "Ajouter une ville",
"editCity": "Modifier",
"noCities": "Aucune ville",
"cityNameAr": "Nom en arabe",
"cityNameFr": "Nom en français",
"cityNameEn": "Nom en anglais (optionnel)",
"reports": "Signalements",
"reviews": "Avis",
"reporter": "Signaleur",
"reviewer": "Évaluateur",
"reviewee": "Évalué",
"deleteReport": "Supprimer le signalement",
"noReports": "Aucun signalement",
"noReviews": "Aucun avis",
"banned": "Banni",
"banUser": "Bannir l'utilisateur",
"unbanUser": "Débannir l'utilisateur"
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/api/cities.ts apps/frontend/src/i18n/locales/
git commit -m "feat(i18n): add cities API methods and missing translation keys"
```

---

## Task 2: Admin Cities CRUD page

**Files:**
- Create: `apps/frontend/src/pages/admin/CitiesPage.tsx`

**Interfaces:**
- Consumes: `citiesApi.getAll()`, `citiesApi.create(dto)`, `citiesApi.update(id, dto)`, `citiesApi.remove(id)` from Task 1
- Consumes: `City` type from `@wasslni/shared-types` — shape: `{ _id, nameAr, nameFr, nameEn?, lat, lng, isActive }`
- Consumes: i18n keys from Task 1: `admin.cities`, `admin.addCity`, `admin.editCity`, `admin.noCities`, `admin.cityNameAr`, `admin.cityNameFr`, `admin.cityNameEn`, `common.save`, `common.cancel`, `common.delete`, `common.confirmDelete`, `common.error`
- Produces: `CitiesPage` named export

- [ ] **Step 1: Create CitiesPage.tsx**

Create `apps/frontend/src/pages/admin/CitiesPage.tsx`:

```tsx
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

function CityFormFields({ form, isPending }: { form: ReturnType<typeof useForm<CityForm>>; isPending: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label={t('admin.cityNameAr')} error={form.formState.errors.nameAr?.message} {...form.register('nameAr')} />
        <Input label={t('admin.cityNameFr')} error={form.formState.errors.nameFr?.message} {...form.register('nameFr')} />
      </div>
      <Input label={t('admin.cityNameEn')} error={form.formState.errors.nameEn?.message} {...form.register('nameEn')} />
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
        onSubmit={form.handleSubmit((d) => mutation.mutate({ ...d, nameEn: d.nameEn || undefined }))}
        onReset={() => { form.reset(); onSuccess(); }}
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
          onSubmit={form.handleSubmit((d) => updateMutation.mutate({ ...d, nameEn: d.nameEn || undefined }))}
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
          <p className="font-medium">{city.nameAr} · {city.nameFr}{city.nameEn ? ` · ${city.nameEn}` : ''}</p>
          <p className="text-sm text-slate-500">{city.lat}, {city.lng}</p>
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
            onClick={() => { if (window.confirm(t('common.confirmDelete'))) deleteMutation.mutate(); }}
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
        <div className="flex justify-center py-12"><Spinner /></div>
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
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /path/to/wasslni && docker compose -f docker/docker-compose.yml logs frontend --tail 20
```

Expected: No TypeScript errors in the log (or run `npx tsc --noEmit` inside the frontend app).

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/admin/CitiesPage.tsx
git commit -m "feat(admin): add Cities CRUD page with inline add/edit/delete"
```

---

## Task 3: Driver EditRide page

**Files:**
- Create: `apps/frontend/src/pages/driver/EditRidePage.tsx`

**Interfaces:**
- Consumes: `ridesApi.getById(id)`, `ridesApi.update(id, payload)` from `@/api/rides`
- Consumes: `bookingsApi.forRide(rideId)` from `@/api/bookings` — returns `Booking[]`
- Consumes: `BookingStatus.Accepted` from `@wasslni/shared-types`
- Consumes: `useCities()` hook, `CitySelect` component, `vehiclesApi.getMine()`
- Consumes: i18n keys from Task 1: `driver.editRide`, `driver.editRideBlocked`, `common.back`, `common.save`, `common.error`
- Produces: `EditRidePage` named export

- [ ] **Step 1: Create EditRidePage.tsx**

Create `apps/frontend/src/pages/driver/EditRidePage.tsx`:

```tsx
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
    return <div className="flex justify-center py-12"><Spinner /></div>;
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
        <form onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
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

          <Button type="submit" disabled={updateMutation.isPending} className="w-full py-3">
            {t('common.save')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/pages/driver/EditRidePage.tsx
git commit -m "feat(driver): add EditRide page with booking-state guard"
```

---

## Task 4: Wire routes and add Edit button to MyRidesPage

**Files:**
- Modify: `apps/frontend/src/routes/index.tsx`
- Modify: `apps/frontend/src/pages/driver/MyRidesPage.tsx`

**Interfaces:**
- Consumes: `EditRidePage` from Task 3
- Consumes: `CitiesPage` from Task 2
- Consumes: `driver.editRide` i18n key from Task 1

- [ ] **Step 1: Update routes/index.tsx**

Add the `EditRidePage` import and `CitiesPage` import, replace the cities placeholder, and add the edit route.

In `apps/frontend/src/routes/index.tsx`:

After the existing imports, add:
```tsx
import { EditRidePage } from '@/pages/driver/EditRidePage';
import { CitiesPage } from '@/pages/admin/CitiesPage';
```

Inside the `UserLayout` block, after `<Route path="create-ride" element={<CreateRidePage />} />`, add:
```tsx
<Route path="my-rides/:id/edit" element={<EditRidePage />} />
```

Replace:
```tsx
<Route path="cities" element={<PlaceholderPage title="Cities" />} />
```
with:
```tsx
<Route path="cities" element={<CitiesPage />} />
```

- [ ] **Step 2: Add Edit button to MyRidesPage**

In `apps/frontend/src/pages/driver/MyRidesPage.tsx`, add the `Link` import if not present (it already is) and import `useNavigate` if needed.

Find the section that renders the Cancel button for Scheduled rides (around line 210). The existing pattern is:

```tsx
{(ride as unknown as { status: string }).status === RideStatus.Scheduled && (
  <div className="px-1">
    {cancellingRideId === ride._id ? (
      ...cancel form...
    ) : (
      <Button
        variant="ghost"
        className="text-sm text-red-500 hover:text-red-700"
        onClick={() => { setCancellingRideId(ride._id); setCancelReason(''); }}
      >
        {t('driver.cancelRide')}
      </Button>
    )}
  </div>
)}
```

Replace the entire `{cancellingRideId === ride._id ? ... : <Button>cancelRide</Button>}` inner block with:

```tsx
{cancellingRideId === ride._id ? (
  <div className="space-y-2 rounded-lg border border-red-100 bg-red-50 p-3">
    <p className="text-sm font-medium text-red-700">{t('driver.cancelRideConfirm')}</p>
    <textarea
      className="w-full rounded-md border border-red-200 bg-white p-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-300"
      rows={2}
      maxLength={500}
      placeholder={t('driver.cancelReasonPlaceholder')}
      value={cancelReason}
      onChange={(e) => setCancelReason(e.target.value)}
    />
    <div className="flex gap-2">
      <Button
        className="bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
        onClick={() => cancelRideMutation.mutate({ id: ride._id, reason: cancelReason })}
        disabled={cancelRideMutation.isPending}
      >
        {t('driver.confirmCancel')}
      </Button>
      <Button variant="ghost" onClick={() => setCancellingRideId(null)}>
        {t('common.back')}
      </Button>
    </div>
  </div>
) : (
  <div className="flex gap-2">
    <Link to={`/app/my-rides/${ride._id}/edit`}>
      <Button variant="secondary" className="text-sm px-3 py-1.5">
        {t('driver.editRide')}
      </Button>
    </Link>
    <Button
      variant="ghost"
      className="text-sm text-red-500 hover:text-red-700"
      onClick={() => { setCancellingRideId(ride._id); setCancelReason(''); }}
    >
      {t('driver.cancelRide')}
    </Button>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/routes/index.tsx apps/frontend/src/pages/driver/MyRidesPage.tsx
git commit -m "feat(routing): wire EditRide and AdminCities routes; add Edit button to MyRidesPage"
```

---

## Task 5: Build, deploy, and verify

- [ ] **Step 1: Rebuild and deploy frontend**

```bash
docker build -t wasslni-frontend:latest -f docker/frontend/Dockerfile . && \
docker stop wasslni-frontend && \
docker run -d --rm --name wasslni-frontend \
  --network wasslni-network \
  -p 80:80 \
  wasslni-frontend:latest
```

Or if using docker compose:
```bash
docker compose -f docker/docker-compose.yml up --build frontend -d
```

- [ ] **Step 2: Verify Admin Cities page**

1. Log in as admin at `http://localhost/login`
2. Navigate to `http://localhost/admin/cities`
3. Confirm city list loads (or "no cities" message)
4. Click "Add City" → form expands → fill in nameAr, nameFr, lat, lng → Save
5. Confirm new city appears in list
6. Click Edit on a city → inline form pre-filled → change a name → Save → confirm update
7. Click Delete → confirm dialog → city removed from list

- [ ] **Step 3: Verify Driver EditRide page**

1. Log in as a driver
2. Navigate to `http://localhost/app/my-rides`
3. On a Scheduled ride with no accepted bookings: confirm "Edit Ride" button appears alongside "Cancel Ride"
4. Click Edit → navigates to `/app/my-rides/:id/edit` → form pre-filled with ride data
5. Change price or time → Save → redirects to `/app/my-rides`
6. On a Scheduled ride with accepted bookings: click Edit → blocking alert shown, no form
7. Confirm Cancel button still works as before

- [ ] **Step 4: Final commit if any fixes applied**

```bash
git add -p
git commit -m "fix: post-deploy corrections for EditRide and AdminCities"
```
