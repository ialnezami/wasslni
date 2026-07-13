import { useTranslation } from 'react-i18next';
import { DashboardLayout } from './DashboardLayout';

export function AdminLayout() {
  const { t } = useTranslation();

  const adminLinks = [
    { to: '/admin', label: t('nav.dashboard') },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/cities', label: 'Cities' },
    { to: '/admin/trips', label: 'Trips' },
    { to: '/admin/reports', label: 'Reports' },
  ];

  return <DashboardLayout title="Admin" links={adminLinks} />;
}
