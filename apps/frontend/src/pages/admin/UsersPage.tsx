import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, Spinner, Badge } from '@/components/ui';
import type { User } from '@wasslni/shared-types';

export function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => apiClient.get<User[]>('/admin/users').then((r) => r.data),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, ban }: { id: string; ban: boolean }) =>
      apiClient.patch(`/admin/users/${id}/ban`, { ban }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('admin.users')}</h2>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          {users.map((u: User) => (
            <Card key={u._id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{u.fullName}</p>
                  <p className="text-sm text-slate-500">{u.email} · {u.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  {u.isBanned && <Badge variant="danger">{t('admin.banned')}</Badge>}
                  <button
                    onClick={() => banMutation.mutate({ id: u._id, ban: !u.isBanned })}
                    disabled={banMutation.isPending}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
                  >
                    {u.isBanned ? t('admin.unbanUser') : t('admin.banUser')}
                  </button>
                  <button
                    onClick={() => { if (confirm(t('common.confirmDelete'))) deleteMutation.mutate(u._id); }}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg border border-red-100 px-3 py-1 text-sm text-red-500 hover:bg-red-50"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
