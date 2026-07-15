# UI Refresh — Dark/Light Theme + Icons + Mobile Nav

**Date:** 2026-07-15  
**Status:** Approved

---

## Goal

Improve the UX/UI of the Wasslni dashboard by adding:
1. Dark/light theme toggle with persistent preference
2. Icons + labels in the sidebar (WhatsApp/Telegram style)
3. Mobile bottom tab bar replacing the 11-item horizontal scroll

---

## 1. Theme System

### Tailwind config
`darkMode: 'class'` — enables `dark:` variants throughout the app.

### CSS tokens (`apps/frontend/src/index.css`)
Define on `:root` (light) and `.dark` (dark):

| Token | Light | Dark |
|---|---|---|
| `--bg-page` | slate-50 | slate-950 |
| `--bg-surface` | white | slate-900 |
| `--bg-muted` | slate-100 | slate-800 |
| `--text-primary` | slate-900 | slate-50 |
| `--text-secondary` | slate-600 | slate-300 |
| `--text-muted` | slate-500 | slate-400 |
| `--border` | slate-200 | slate-700 |

### `useTheme` hook (`apps/frontend/src/hooks/useTheme.ts`)
- Reads `localStorage.theme` on mount; falls back to `prefers-color-scheme`
- Applies/removes `.dark` class on `<html>`
- Exposes `{ theme, toggle }` 

### `ThemeToggle` component (`apps/frontend/src/components/ThemeToggle.tsx`)
- `Sun` icon when in dark mode (click → go light)
- `Moon` icon when in light mode (click → go dark)
- Placed in the dashboard header (top-right area)

### Component dark-mode additions
Add `dark:` variants to: `DashboardLayout`, `Card`, `Badge`, `Input`, `Select`, `Button` (secondary/ghost variants), `Alert`, `ChatDrawer`, `PublicLayout` header/footer.

No API changes — only class additions.

---

## 2. Icon Library

Install `lucide-react` in `apps/frontend` only.

### Icon assignments

| Route | Icon name |
|---|---|
| `/app` | `LayoutDashboard` |
| `/app/my-rides` | `Car` |
| `/app/create-ride` | `Plus` |
| `/app/booking-requests` | `Inbox` |
| `/app/bookings` | `Ticket` |
| `/app/vehicles` | `Truck` |
| `/app/chats` | `MessageSquare` |
| `/app/notifications` | `Bell` |
| `/app/profile` | `UserCircle` |
| `/app/reviews` | `Star` |
| `/search` | `Search` |

---

## 3. Desktop Sidebar Redesign

### Structure
```
┌─────────────────────┐
│  [Avatar] Name      │  ← initials circle + full name + role badge
│                     │
│  [Section: عام]     │
│  ▶ LayoutDashboard  حسابي
│  ▶ Search           بحث
│                     │
│  [Section: كسائق]   │
│  ▶ Car              رحلاتي
│  ▶ Plus             نشر رحلة
│  ▶ Inbox            طلبات الحجز
│  ▶ Truck            مركباتي
│                     │
│  [Section: حسابي]   │
│  ▶ Ticket           حجوزاتي
│  ▶ MessageSquare    الرسائل
│  ▶ Bell             الإشعارات
│  ▶ Star             تقييماتي
│  ▶ UserCircle       ملفي
│                     │
│  [ThemeToggle]      │
│  [Logout]           │
└─────────────────────┘
```

### Active state
- 2px emerald-600 border on the inline-start edge
- `bg-emerald-50 dark:bg-emerald-950` background
- `text-emerald-700 dark:text-emerald-400` text + icon

### UserLayout changes
- `links` array gains an `icon` field (Lucide component)
- Section headers are new `type: 'section'` entries in the array
- Sidebar width stays 220px

---

## 4. Mobile Bottom Tab Bar

### Fixed bottom bar (5 tabs)
Replaces the horizontal pill scroll on `md:hidden`.

| Tab | Icon | Route |
|---|---|---|
| الرئيسية | `LayoutDashboard` | `/app` |
| بحث | `Search` | `/search` |
| حجوزاتي | `Ticket` | `/app/bookings` |
| الرسائل | `MessageSquare` | `/app/chats` |
| ملفي | `UserCircle` | `/app/profile` |

### "More" bottom sheet
Tap a `Menu` icon (6th slot, end of bar) → sheet slides up from bottom.
Contains remaining items: My Rides, Create Ride, Booking Requests, Vehicles, Notifications, Reviews.
Tap backdrop or any item → sheet closes.

### Styling
- `fixed bottom-0 inset-x-0 z-30`
- `pb-[env(safe-area-inset-bottom)]` for iPhone notch
- `bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700`
- Active: `text-emerald-600 dark:text-emerald-400`
- Inactive: `text-slate-400 dark:text-slate-500`
- Main content area gets `pb-16` on mobile to avoid overlap

---

## Files Changed

### New files
- `apps/frontend/src/hooks/useTheme.ts`
- `apps/frontend/src/components/ThemeToggle.tsx`
- `apps/frontend/src/components/BottomNav.tsx`
- `apps/frontend/src/components/MoreSheet.tsx`

### Modified files
- `apps/frontend/tailwind.config.js` — add `darkMode: 'class'`
- `apps/frontend/src/index.css` — add CSS token variables
- `apps/frontend/src/layouts/DashboardLayout.tsx` — icons, sections, bottom nav, theme toggle, dark classes
- `apps/frontend/src/layouts/UserLayout.tsx` — icon + section metadata in links array
- `apps/frontend/src/components/ui/index.tsx` — dark variants on Card, Badge, Input, Select, Alert, Spinner
- `packages/shared-ui/src/Button.tsx` — dark variants on secondary/ghost
- `apps/frontend/src/components/ChatDrawer.tsx` — dark variants
- `apps/frontend/src/layouts/PublicLayout.tsx` — dark variants on header/footer

### Dependencies
- `lucide-react` added to `apps/frontend/package.json`
