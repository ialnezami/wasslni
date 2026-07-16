import { LayoutDashboard, Car, PlusCircle, ClipboardList, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from './DashboardLayout';

export function DriverLayout() {
  const { t } = useTranslation();

  const driverLinks = [
    { to: '/driver', label: t('nav.dashboard'), icon: LayoutDashboard, bottomNav: true },
    { to: '/driver/rides', label: t('driver.myRides'), icon: Car, bottomNav: true },
    { to: '/driver/rides/new', label: t('driver.createRide'), icon: PlusCircle, bottomNav: true },
    { to: '/driver/bookings', label: t('driver.bookingRequests'), icon: ClipboardList, bottomNav: true },
    { to: '/driver/vehicles', label: t('driver.vehicles'), icon: Truck },
  ];

  return <DashboardLayout title={t('driver.dashboardTitle')} links={driverLinks} />;
}
