import { useTranslation } from 'react-i18next';
import { DashboardLayout } from './DashboardLayout';

export function PassengerLayout() {
  const { t } = useTranslation();

  const passengerLinks = [
    { to: '/passenger', label: t('nav.dashboard') },
    { to: '/passenger/bookings', label: t('booking.title') },
    { to: '/passenger/notifications', label: t('passenger.notificationsTitle') },
    { to: '/passenger/profile', label: t('passenger.profileTitle') },
    { to: '/passenger/reviews', label: t('passenger.reviewsTitle') },
  ];

  return (
    <DashboardLayout title={t('nav.dashboard')} links={passengerLinks} />
  );
}
