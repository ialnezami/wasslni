import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, Spinner } from '@/components/ui';

interface Reporter {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface Report {
  _id: string;
  reporterId: Reporter;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
  createdAt: string;
}

export function AdminReportsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['admin', 'reports'],
    queryFn: () => apiClient.get<Report[]>('/admin/reports').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/reports/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('admin.reports')}</h2>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : reports.length === 0 ? (
        <p className="py-12 text-center text-slate-500">{t('admin.noReports')}</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r: Report) => (
            <Card key={r._id}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {r.reason}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {r.targetType}
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {t('admin.reporter')}: {r.reporterId?.fullName ?? '—'}{' '}
                    <span className="text-slate-500">({r.reporterId?.email})</span>
                  </p>
                  {r.description && (
                    <p className="text-sm text-slate-600">{r.description}</p>
                  )}
                  <p className="text-xs text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString('ar')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(t('common.confirmDelete'))) deleteMutation.mutate(r._id);
                  }}
                  disabled={deleteMutation.isPending}
                  className="shrink-0 rounded-lg border border-red-100 px-3 py-1 text-sm text-red-500 hover:bg-red-50"
                >
                  {t('admin.deleteReport')}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
