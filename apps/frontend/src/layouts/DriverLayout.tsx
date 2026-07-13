import { useTranslation } from 'react-i18next';
import { DashboardLayout } from './DashboardLayout';

export function DriverLayout() {
  const { t } = useTranslation();

  const driverLinks = [
    { to: '/driver', label: t('nav.dashboard') },
    { to: '/driver/rides', label: t('driver.myRides') },
    { to: '/driver/rides/new', label: t('driver.createRide') },
    { to: '/driver/bookings', label: t('driver.bookingRequests') },
    { to: '/driver/vehicles', label: t('driver.vehicles') },
  ];

  return <DashboardLayout title={t('driver.dashboardTitle')} links={driverLinks} />;
}
