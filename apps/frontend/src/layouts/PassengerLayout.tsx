import { LayoutDashboard, Ticket, Bell, UserCircle, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from './DashboardLayout';

export function PassengerLayout() {
  const { t } = useTranslation();

  const passengerLinks = [
    { to: '/passenger', label: t('nav.dashboard'), icon: LayoutDashboard, bottomNav: true },
    { to: '/passenger/bookings', label: t('booking.title'), icon: Ticket, bottomNav: true },
    { to: '/passenger/notifications', label: t('passenger.notificationsTitle'), icon: Bell, bottomNav: true },
    { to: '/passenger/profile', label: t('passenger.profileTitle'), icon: UserCircle, bottomNav: true },
    { to: '/passenger/reviews', label: t('passenger.reviewsTitle'), icon: Star },
  ];

  return <DashboardLayout title={t('nav.dashboard')} links={passengerLinks} />;
}
