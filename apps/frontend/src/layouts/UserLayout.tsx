import { useTranslation } from 'react-i18next';
import { DashboardLayout } from './DashboardLayout';

export function UserLayout() {
  const { t } = useTranslation();

  const links = [
    { to: '/app', label: t('nav.dashboard') },
    { to: '/app/my-rides', label: t('user.myRides') },
    { to: '/app/create-ride', label: t('user.createRide') },
    { to: '/app/booking-requests', label: t('user.bookingRequests') },
    { to: '/app/bookings', label: t('user.myBookings') },
    { to: '/app/vehicles', label: t('user.vehicles') },
    { to: '/app/notifications', label: t('user.notifications') },
    { to: '/app/profile', label: t('user.profile') },
    { to: '/app/reviews', label: t('user.reviews') },
  ];

  return <DashboardLayout title={t('app.name')} links={links} />;
}
