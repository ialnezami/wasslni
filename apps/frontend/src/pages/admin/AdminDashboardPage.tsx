import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, Spinner } from '@/components/ui';

interface Stats { users: number; rides: number; bookings: number; reports: number; }

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiClient.get<Stats>('/admin/stats').then((r) => r.data),
  });

  const cards = stats ? [
    { label: t('admin.totalUsers'), value: stats.users },
    { label: t('admin.totalRides'), value: stats.rides },
    { label: t('admin.totalBookings'), value: stats.bookings },
    { label: t('admin.totalReports'), value: stats.reports },
  ] : [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">{t('admin.dashboard')}</h2>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <Card key={c.label}>
              <p className="text-3xl font-bold text-emerald-600">{c.value}</p>
              <p className="mt-1 text-sm text-slate-600">{c.label}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
