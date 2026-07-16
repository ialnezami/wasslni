# Wasslni Mobile App — Design Spec
**Date:** 2026-07-17
**Scope:** Driver + Passenger (no Admin)
**Status:** Approved

---

## 1. Overview

A React Native mobile app for the Wasslni carpooling platform, living at `apps/mobile/` inside the existing Turbo monorepo. It targets iOS and Android via Expo, uses Expo Router for file-based navigation, and mirrors the web frontend's data layer pattern while remaining an independent workspace.

**Primary locale:** Arabic (RTL). Secondary: French, English.

---

## 2. Project Setup & Monorepo Integration

### Location
`apps/mobile/` — picked up automatically by the Turbo `apps/*` workspace glob.

### Key Dependencies
| Package | Purpose |
|---|---|
| `expo` (SDK 52) | Runtime and build toolchain |
| `expo-router` v4 | File-based routing and navigation |
| `nativewind` v4 + `tailwindcss` | Utility-class styling (mirrors web) |
| `@tanstack/react-query` | Server state and caching |
| `axios` | HTTP client |
| `expo-secure-store` | Encrypted token storage (iOS Keychain / Android Keystore) |
| `i18next` + `react-i18next` + `expo-localization` | Arabic-first i18n |
| `@wasslni/shared-types` | Shared TypeScript types and enums (workspace dep) |

### Turbo Integration
`apps/mobile/package.json` defines:
- `"dev": "expo start"` — participates in `turbo run dev`
- `"build": "expo export"` — participates in `turbo run build`

### API Layer
`apps/mobile/src/api/` mirrors `apps/frontend/src/api/` in structure and function signatures:
- `client.ts` — Axios instance pointing at `EXPO_PUBLIC_API_URL`
- `auth.ts`, `rides.ts`, `bookings.ts`, `cities.ts`, `vehicles.ts`, `messages.ts`, etc.
- Backend URL configured via `.env` / EAS environment variables, never hardcoded

---

## 3. Auth Flow

### Token Storage
Both access token and refresh token stored in `expo-secure-store` (encrypted). Neither is stored in AsyncStorage or memory-only.

### Lifecycle
1. **Login / Register** → store `accessToken` + `refreshToken` in secure store
2. **App launch** → read `accessToken` from secure store → restore auth state silently (no login screen flash)
3. **401 response** → Axios interceptor reads `refreshToken`, calls `POST /auth/refresh`, writes new token pair to secure store, retries original request once
4. **Refresh failure** → clear both tokens, clear React Query cache, redirect to `/(auth)/login`
5. **Logout** → delete both tokens, clear React Query cache, redirect to `/(auth)/login`

### Auth Context
`useAuth()` hook (provided by `AuthProvider` in `app/_layout.tsx`) exposes:
- `user` — current user object (from `@wasslni/shared-types`)
- `role` — `UserRole` enum value
- `isLoading` — true during initial token restore
- `login(credentials)` — calls API, stores tokens, sets user
- `logout()` — clears tokens and state

### Protected Routing
Root `app/_layout.tsx` reads auth state:
- Unauthenticated → `<Redirect href="/(auth)/login" />`
- Authenticated → renders `(app)` group
- Role checks for Driver-only screens happen inside `(app)/_layout.tsx` tab configuration

### RTL Bootstrap
Called in root `_layout.tsx` before first render:
```ts
const isRTL = language === 'ar';
if (I18nManager.isRTL !== isRTL) {
  I18nManager.forceRTL(isRTL);
  // trigger app reload
}
```

---

## 4. Navigation Structure

File layout under `apps/mobile/app/`:

```
_layout.tsx                    # Root: QueryClientProvider, AuthProvider, i18n init, RTL bootstrap
(auth)/
  _layout.tsx                  # Stack navigator, no tab bar
  login.tsx
  register.tsx
(app)/
  _layout.tsx                  # Bottom tab navigator (role-aware)
  index.tsx                    # Dashboard
  search.tsx                   # Search rides
  notifications.tsx
  profile.tsx
  reviews.tsx
  rides/
    [id].tsx                   # Ride details + book action
  chats/
    index.tsx                  # Conversations list
    [id].tsx                   # Chat thread
  my-rides/
    index.tsx                  # Driver: My Rides list
    [id]/
      edit.tsx                 # Driver: Edit Ride
  create-ride.tsx              # Driver only
  booking-requests.tsx         # Driver only
  vehicles.tsx                 # Driver only
  bookings/
    index.tsx                  # Passenger: My Bookings
    [id].tsx                   # Passenger: Booking detail
```

### Tab Bar (role-aware)
**All users:** Dashboard, Search, Notifications, Profile

**Driver additional tabs:** My Rides, Create Ride, Booking Requests

**Passenger additional tabs:** My Bookings

Driver-only routes are hidden from the tab bar for Passengers (not disabled — deep links still resolve). Role is sourced from `useAuth().role`.

---

## 5. RTL & i18n

### Default Locale
Arabic (`ar`) is the default. Language preference is persisted in `expo-secure-store`.

### Translation Files
`apps/mobile/src/i18n/ar.json`, `en.json`, `fr.json` — seeded from the web frontend's translation files (same key structure). Mobile-specific keys added as needed.

### RTL Strategy
- `expo-localization` detects system locale on first launch
- User can override language in Profile screen
- `I18nManager.forceRTL(true/false)` applied on language change
- Language change requires app reload — Profile screen shows a toast and triggers controlled reload
- NativeWind: use logical properties (`ps-`, `pe-`, `ms-`, `me-`) everywhere — no `pl-`/`pr-`/`ml-`/`mr-`
- React Native flex layout flips automatically once `forceRTL` is set

---

## 6. Screen Inventory

### Public / Auth
| Screen | Route |
|---|---|
| Login | `/(auth)/login` |
| Register | `/(auth)/register` |

### Shared (Driver + Passenger)
| Screen | Route |
|---|---|
| Dashboard | `/(app)/` |
| Search Rides | `/(app)/search` |
| Ride Details | `/(app)/rides/[id]` |
| Notifications | `/(app)/notifications` |
| Profile | `/(app)/profile` |
| Reviews | `/(app)/reviews` |
| Chats List | `/(app)/chats/` |
| Chat Thread | `/(app)/chats/[id]` |

### Driver
| Screen | Route |
|---|---|
| My Rides | `/(app)/my-rides/` |
| Edit Ride | `/(app)/my-rides/[id]/edit` |
| Create Ride | `/(app)/create-ride` |
| Booking Requests | `/(app)/booking-requests` |
| Vehicles | `/(app)/vehicles` |

### Passenger
| Screen | Route |
|---|---|
| My Bookings | `/(app)/bookings/` |
| Booking Detail | `/(app)/bookings/[id]` |

---

## 7. What's Out of Scope

- Admin panel (Cities, Users, Reports, Reviews management)
- Push notifications (can be added via `expo-notifications` in a future phase)
- Offline mode / local caching beyond React Query's default
- EAS build configuration and app store submission (separate phase)
