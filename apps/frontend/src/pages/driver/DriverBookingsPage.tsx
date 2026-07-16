import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingStatus } from '@wasslni/shared-types';
import { Card, Spinner, Badge } from '@/components/ui';
import { Button } from '@wasslni/shared-ui';
import { EmptyState } from '@/components/EmptyState';
import { ChatDrawer } from '@/components/ChatDrawer';
import { bookingsApi } from '@/api/bookings';
import type { Booking } from '@wasslni/shared-types';

export function DriverBookingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: allBookings = [], isLoading, isError } = useQuery({
    queryKey: ['bookings', 'driver'],
    queryFn: () => bookingsApi.getForDriver().then((r) => r.data),
  });

  const acceptMutation = useMutation({
    mutationFn: bookingsApi.accept,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'driver'] }),
  });
  const rejectMutation = useMutation({
    mutationFn: bookingsApi.reject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', 'driver'] }),
  });
  const cancelByDriverMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => bookingsApi.cancelByDriver(id, reason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'driver'] });
      setCancellingBookingId(null);
      setCancelReason('');
    },
  });

  const [chatBookingId, setChatBookingId] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const pending = allBookings.filter((b) => b.status === BookingStatus.Pending);
  const rest = allBookings.filter((b) => b.status !== BookingStatus.Pending);

  const statusVariant = (s: BookingStatus): 'success' | 'danger' | 'default' | 'warning' =>
    s === BookingStatus.Accepted ? 'success' : s === BookingStatus.Rejected ? 'danger' : s === BookingStatus.Cancelled ? 'default' : 'warning';

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  if (isError) return (
    <div className="py-12 text-center text-sm text-slate-500">{t('common.error')}</div>
  );

  if (allBookings.length === 0) return (
    <EmptyState icon="📬" title={t('driver.bookingRequests')} description={t('passenger.notificationsEmpty')} />
  );

  return (
    <>
      {chatBookingId && (
        <ChatDrawer
          bookingId={chatBookingId}
          otherPartyName={t('chat.passenger')}
          onClose={() => setChatBookingId(null)}
        />
      )}
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
                  <p className="text-xs text-slate-400">{new Date(b.createdAt).toLocaleDateString('ar')}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setChatBookingId(b._id)}
                  >
                    {t('chat.open')}
                  </Button>
                  <Button
                    onClick={() => acceptMutation.mutate(b._id)}
                    disabled={acceptMutation.isPending}
                    className="bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                  >
                    {t('driver.accept')}
                  </Button>
                  <Button
                    onClick={() => rejectMutation.mutate(b._id)}
                    disabled={rejectMutation.isPending}
                    className="bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
                  >
                    {t('driver.reject')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-slate-700">{t('driver.allRequests')}</h3>
          {rest.map((b: Booking) => (
            <Card key={b._id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{t('booking.seats', { count: b.seats })}</p>
                  <Badge variant={statusVariant(b.status)}>{t(`booking.status.${b.status}`)}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setChatBookingId(b._id)}>
                    {t('chat.open')}
                  </Button>
                  {b.status === BookingStatus.Accepted && (
                    <Button
                      className="bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
                      onClick={() => { setCancellingBookingId(b._id); setCancelReason(''); }}
                    >
                      {t('driver.cancelBooking')}
                    </Button>
                  )}
                </div>
              </div>
              {cancellingBookingId === b._id && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  <textarea
                    className="w-full rounded-md border border-slate-200 p-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    rows={2}
                    maxLength={500}
                    placeholder={t('driver.cancelReasonPlaceholder')}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      className="bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
                      onClick={() => cancelByDriverMutation.mutate({ id: b._id, reason: cancelReason })}
                      disabled={cancelByDriverMutation.isPending}
                    >
                      {t('driver.confirmCancel')}
                    </Button>
                    <Button variant="ghost" onClick={() => setCancellingBookingId(null)}>
                      {t('common.back')}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
