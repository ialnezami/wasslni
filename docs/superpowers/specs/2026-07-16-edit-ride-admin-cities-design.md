# Design: Driver EditRide + Admin Cities CRUD

**Date:** 2026-07-16
**Status:** Approved

---

## 1. Driver EditRide Page

### Goal
Allow drivers to edit a scheduled ride that has no accepted bookings.

### Route
`/app/my-rides/:id/edit`

### New File
`apps/frontend/src/pages/driver/EditRidePage.tsx`

### Entry Point
MyRidesPage: "Edit" button appears next to "Cancel" only when `ride.status === RideStatus.Scheduled`. Clicking navigates to `/app/my-rides/:id/edit`.

### Page Behavior

1. Fetch the ride by ID via `ridesApi.getById(id)`
2. Fetch bookings for this ride and filter to `BookingStatus.Accepted`
3. **If accepted bookings exist:** render a blocking alert — "Cannot edit ride — passengers have confirmed bookings." Show a Back button. No form.
4. **If no accepted bookings:** render a pre-filled edit form with current ride data.
5. On submit: call `ridesApi.update(id, payload)`, on success navigate to `/app/my-rides`

### Form Fields
Same fields as CreateRidePage:
- Vehicle (select from driver's vehicles)
- Departure City / Destination City (CitySelect components)
- Departure Point (text)
- Date (date picker)
- Departure Time (time picker)
- Price (number)
- Description (optional text)

**Not included:** `totalSeats` — backend `UpdateRideDto` intentionally excludes it to prevent overselling.

### Route Registration
Add to `apps/frontend/src/routes/index.tsx` inside the `UserLayout` block:
```
<Route path="my-rides/:id/edit" element={<EditRidePage />} />
```

### API
No new API methods needed — `ridesApi.update(id, payload)` already exists.
Bookings check: use `bookingsApi.getForRide(rideId)` (may need adding) or filter from driver's existing booking queries.

---

## 2. Admin Cities CRUD Page

### Goal
Allow admins to create, edit, and delete cities that drivers pick from when creating rides.

### Route
`/admin/cities` (replace existing `PlaceholderPage`)

### New File
`apps/frontend/src/pages/admin/CitiesPage.tsx`

### Layout

**Header row:** "Cities" title + "Add City" toggle button (collapses/expands form below)

**Add form (collapsible, hidden by default):**
- Arabic name (required)
- French name (required)
- English name (optional)
- Latitude (number, -90 to 90)
- Longitude (number, -180 to 180)
- Save / Cancel buttons

**City list:** one card per city showing:
- nameAr + nameFr (primary display)
- lat/lng coordinates
- isActive badge
- Edit button (expands inline edit form in place of the display row)
- Delete button (window.confirm then DELETE)

**Inline edit:** clicking Edit on a row replaces display with an edit form pre-filled with city data. Save calls PATCH, Cancel reverts to display.

### Validation (Zod)
```ts
z.object({
  nameAr: z.string().min(1).max(100),
  nameFr: z.string().min(1).max(100),
  nameEn: z.string().max(100).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})
```

### API Additions (`apps/frontend/src/api/cities.ts`)
```ts
create: (dto) => apiClient.post<City>('/cities', dto)
update: (id, dto) => apiClient.patch<City>(`/cities/${id}`, dto)
remove: (id) => apiClient.delete(`/cities/${id}`)
```

### Route Update
Replace in `apps/frontend/src/routes/index.tsx`:
```
<Route path="cities" element={<PlaceholderPage title="Cities" />} />
```
with:
```
<Route path="cities" element={<CitiesPage />} />
```

---

## Constraints

- RTL support: use Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`)
- i18n: all user-facing strings via `useTranslation()`
- No backend changes needed — all endpoints already exist and are properly guarded
- Follow existing component patterns: `Card`, `Input`, `Select`, `Alert`, `Button`, `Spinner`, `Badge` from `@/components/ui` and `@wasslni/shared-ui`
