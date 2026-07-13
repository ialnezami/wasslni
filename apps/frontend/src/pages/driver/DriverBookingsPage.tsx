import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingStatus } from '@wasslni/shared-types';
import { Card, Spinner, Badge } from '@/components/ui';
import { Button } from '@wasslni/shared-ui';
import { EmptyState } from '@/components/EmptyState';
import { ridesApi } from '@/api/rides';
import { bookingsApi } from '@/api/bookings';
import type { Booking } from '@wasslni/shared-types';

export function DriverBookingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: rides = [], isLoading: ridesLoading } = useQuery({
    queryKey: ['rides', 'mine'],
    queryFn: () => ridesApi.getMine().then((r) => r.data),
  });

  const { data: allBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', 'driver', rides.map((r) => r._id)],
    queryFn: async () => {
      const results = await Promise.all(rides.map((r) => bookingsApi.forRide(r._id).then((res) => res.data)));
      return results.flat();
    },
    enabled: rides.length > 0,
  });

  const acceptMutation = useMutation({
    mutationFn: bookingsApi.accept,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'driver'] }),
  });
  const rejectMutation = useMutation({
    mutationFn: bookingsApi.reject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'driver'] }),
  });

  const pending = allBookings.filter((b) => b.status === BookingStatus.Pending);

  const statusVariant = (s: BookingStatus): 'success' | 'danger' | 'default' | 'warning' =>
    s === BookingStatus.Accepted ? 'success' : s === BookingStatus.Rejected ? 'danger' : s === BookingStatus.Cancelled ? 'default' : 'warning';

  if (ridesLoading || bookingsLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('driver.bookingRequests')}</h2>

      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-slate-700">{t('driver.pendingRequests')} ({pending.length})</h3>
          {pending.map((b: Booking) => (
            <Card key={b._id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{t('booking.seats', { count: b.seats })}</p>
                  <p className="text-xs text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => acceptMutation.mutate(b._id)} disabled={acceptMutation.isPending} className="bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
                    {t('driver.accept')}
                  </Button>
                  <Button onClick={() => rejectMutation.mutate(b._id)} disabled={rejectMutation.isPending} className="bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100">
                    {t('driver.reject')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {allBookings.length === 0 ? (
        <EmptyState icon="📬" title={t('driver.bookingRequests')} description={t('passenger.notificationsEmpty')} />
      ) : (
        <div className="space-y-3">
          <h3 className="font-medium text-slate-700">{t('driver.allRequests')}</h3>
          {allBookings.map((b: Booking) => (
            <Card key={b._id}>
              <div className="flex items-center justify-between">
                <p className="text-sm">{t('booking.seats', { count: b.seats })}</p>
                <Badge variant={statusVariant(b.status)}>{t(`booking.status.${b.status}`)}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
