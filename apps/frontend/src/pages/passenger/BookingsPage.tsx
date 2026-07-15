import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingStatus, RecurringSubscriptionStatus } from '@wasslni/shared-types';
import type { BookingWithRide, CityRef, RecurringSubscription } from '@wasslni/shared-types';
import { formatDate, formatPrice } from '@/utils/format';
import { Card, Badge, Spinner } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@wasslni/shared-ui';
import { bookingsApi } from '@/api/bookings';
import { recurringSubscriptionsApi } from '@/api/recurringSubscriptions';

const statusVariant: Record<BookingStatus, 'warning' | 'success' | 'danger' | 'default'> = {
  [BookingStatus.Pending]: 'warning',
  [BookingStatus.Accepted]: 'success',
  [BookingStatus.Rejected]: 'danger',
  [BookingStatus.Cancelled]: 'default',
};

function subStatusVariant(status: RecurringSubscriptionStatus): 'warning' | 'success' | 'default' {
  if (status === RecurringSubscriptionStatus.Active) return 'success';
  if (status === RecurringSubscriptionStatus.Pending) return 'warning';
  return 'default';
}

function cityName(city: CityRef, lang: string): string {
  return lang === 'fr' ? city.nameFr : city.nameAr;
}

function SkipDateModal({ subscriptionId, onClose }: { subscriptionId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');

  const skipMutation = useMutation({
    mutationFn: () => recurringSubscriptionsApi.skip(subscriptionId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-subscriptions', 'mine'] });
      onClose();
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="mx-4 w-full max-w-sm">
        <h3 className="mb-4 font-semibold">{t('recurring.skipDay')}</h3>
        <input
          type="date"
          min={minDate}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mb-4 w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="flex gap-2">
          <Button
            onClick={() => skipMutation.mutate()}
            disabled={!date || skipMutation.isPending}
            className="flex-1"
          >
            {t('recurring.skipDay')}
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function BookingsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [skipModalSubId, setSkipModalSubId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: bookings = [], isLoading, isError } = useQuery<BookingWithRide[]>({
    queryKey: ['bookings', 'mine'],
    queryFn: () => bookingsApi.getMine().then((r) => r.data),
  });

  const { data: subscriptions = [] } = useQuery<RecurringSubscription[]>({
    queryKey: ['recurring-subscriptions', 'mine'],
    queryFn: () => recurringSubscriptionsApi.getMine().then((r) => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => {
      setCancellingId(id);
      return bookingsApi.cancel(id);
    },
    onSettled: () => setCancellingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', 'mine'] });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: recurringSubscriptionsApi.unsubscribe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-subscriptions', 'mine'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-red-500">{t('common.errorLoading')}</p>
    );
  }

  const activeBookings = bookings.filter((b) => b.status !== BookingStatus.Cancelled);
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status !== RecurringSubscriptionStatus.Cancelled,
  );

  if (activeBookings.length === 0 && activeSubscriptions.length === 0) {
    return (
      <EmptyState
        title={t('booking.empty')}
        description={t('booking.emptyHint')}
        actionLabel={t('nav.search')}
        actionTo="/search"
      />
    );
  }

  return (
    <div className="space-y-6">
      {skipModalSubId && (
        <SkipDateModal subscriptionId={skipModalSubId} onClose={() => setSkipModalSubId(null)} />
      )}

      {activeBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t('booking.title')}</h2>
          {activeBookings.map((booking) => {
            const ride = booking.rideId;
            const isCancelling = cancellingId === booking._id;
            const canCancel =
              booking.status === BookingStatus.Pending ||
              booking.status === BookingStatus.Accepted;

            return (
              <Card key={booking._id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Badge variant={statusVariant[booking.status]}>
                      {t(`booking.status.${booking.status}`)}
                    </Badge>
                    <h3 className="mt-2 font-semibold text-slate-900">
                      {cityName(ride.departureCityId, i18n.language)} →{' '}
                      {cityName(ride.destinationCityId, i18n.language)}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDate(ride.date, i18n.language)} · {ride.departureTime}
                    </p>
                    <p className="text-sm text-slate-500">
                      {t('booking.seats', { count: booking.seats })} ·{' '}
                      {formatPrice(ride.price * booking.seats, i18n.language)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/rides/${ride._id}`}>
                      <Button variant="secondary">{t('ride.viewDetails')}</Button>
                    </Link>
                    {canCancel && (
                      <Button
                        variant="ghost"
                        onClick={() => cancelMutation.mutate(booking._id)}
                        disabled={isCancelling}
                      >
                        {isCancelling ? t('common.loading') : t('booking.cancel')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">🔁 {t('recurring.mySubscriptions')}</h2>
          {activeSubscriptions.map((sub) => (
            <Card key={sub._id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={subStatusVariant(sub.status as RecurringSubscriptionStatus)}>
                      {t(`recurring.subscriptionStatus.${sub.status}`)}
                    </Badge>
                    <span className="text-xs text-slate-400">{t('recurring.badge')}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {sub.seats} {t('ride.seats')} ·{' '}
                    {sub.scheduleDays === null
                      ? t('recurring.allDays')
                      : sub.scheduleDays.map((d) => t(`recurring.days.${d}`)).join('، ')}
                  </p>
                  {sub.skippedDates.length > 0 && (
                    <p className="text-xs text-slate-400">
                      {sub.skippedDates.length} أيام متخطاة
                    </p>
                  )}
                </div>
                {sub.status === RecurringSubscriptionStatus.Active && (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setSkipModalSubId(sub._id)}>
                      {t('recurring.skipDay')}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => unsubscribeMutation.mutate(sub._id)}
                      disabled={unsubscribeMutation.isPending}
                    >
                      {t('recurring.unsubscribe')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
