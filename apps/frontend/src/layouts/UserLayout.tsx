import {
  LayoutDashboard,
  Car,
  PlusCircle,
  ClipboardList,
  Ticket,
  Truck,
  MessageCircle,
  Bell,
  UserCircle,
  Star,
  Search,
  Home,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUnreadStore } from '@/store/unread.store';
import { DashboardLayout } from './DashboardLayout';

export function UserLayout() {
  const { t } = useTranslation();
  const total = useUnreadStore((s) => s.total);

  const links = [
    { to: '/app', label: t('nav.dashboard'), icon: LayoutDashboard, bottomNav: true },
    { to: '/app/my-rides', label: t('user.myRides'), icon: Car },
    { to: '/app/create-ride', label: t('user.createRide'), icon: PlusCircle },
    { to: '/app/booking-requests', label: t('user.bookingRequests'), icon: ClipboardList },
    { to: '/app/bookings', label: t('user.myBookings'), icon: Ticket, bottomNav: true, badge: total },
    { to: '/app/vehicles', label: t('user.vehicles'), icon: Truck },
    { to: '/app/chats', label: t('chat.inbox'), icon: MessageCircle, bottomNav: true, badge: total },
    { to: '/app/notifications', label: t('user.notifications'), icon: Bell },
    { to: '/app/profile', label: t('user.profile'), icon: UserCircle, bottomNav: true },
    { to: '/app/reviews', label: t('user.reviews'), icon: Star },
    { to: '/search', label: t('nav.search'), icon: Search, dividerBefore: true, bottomNav: true },
    { to: '/', label: t('nav.home'), icon: Home },
  ];

  return <DashboardLayout title={t('app.name')} links={links} />;
}
