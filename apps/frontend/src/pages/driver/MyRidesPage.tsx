import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@wasslni/shared-ui';
import { RideCard } from '@/components/RideCard';
import { EmptyState } from '@/components/EmptyState';
import { Card, Spinner, Badge } from '@/components/ui';
import { ridesApi } from '@/api/rides';
import { recurringTripsApi } from '@/api/recurringTrips';
import { recurringSubscriptionsApi } from '@/api/recurringSubscriptions';
import { DEMO_RIDES } from '@/data/demo';
import type { RideWithDetails } from '@/data/demo';
import type { RecurringSubscription, RecurringTrip } from '@wasslni/shared-types';
import { RecurringSubscriptionStatus, RecurringTripStatus } from '@wasslni/shared-types';

const tripStatusVariant: Record<RecurringTripStatus, 'success' | 'warning' | 'default'> = {
  [RecurringTripStatus.Active]: 'success',
  [RecurringTripStatus.Paused]: 'warning',
  [RecurringTripStatus.Cancelled]: 'default',
};

function RecurringTripCard({ trip }: { trip: RecurringTrip }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: subscribers = [] } = useQuery<RecurringSubscription[]>({
    queryKey: ['recurring-trips', trip._id, 'subscriptions'],
    queryFn: () => recurringTripsApi.getSubscriptions(trip._id).then((r) => r.data),
  });

  const pendingSubs = subscribers.filter((s) => s.status === RecurringSubscriptionStatus.Pending);

  const pauseMutation = useMutation({
    mutationFn: () => recurringTripsApi.pause(trip._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-trips', 'mine'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: () => recurringTripsApi.resume(trip._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-trips', 'mine'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => recurringTripsApi.cancel(trip._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-trips', 'mine'] }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => recurringSubscriptionsApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-trips', trip._id, 'subscriptions'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => recurringSubscriptionsApi.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-trips', trip._id, 'subscriptions'] }),
  });

  const recurrenceLabel =
    trip.recurrence.type === 'daily'
      ? t('recurring.daily')
      : trip.recurrence.days.map((d) => t(`recurring.days.${d}`)).join('، ');

  return (
    <Card>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🔁</span>
            <Badge variant={tripStatusVariant[trip.status as RecurringTripStatus]}>
              {t(`recurring.status.${trip.status}`)}
            </Badge>
          </div>
          <span className="text-xs text-slate-500">{recurrenceLabel}</span>
        </div>

        <div className="text-sm text-slate-600">
          {trip.departureTime} · {trip.price} د.م · {trip.totalSeats} {t('ride.seats')}
        </div>

        <div className="text-xs text-slate-400">
          {subscribers.filter((s) => s.status === RecurringSubscriptionStatus.Active).length} {t('recurring.subscribers')}
          {pendingSubs.length > 0 && (
            <span className="ms-2 font-medium text-amber-600">
              · {pendingSubs.length} {t('recurring.pendingSubscribers')}
            </span>
          )}
        </div>

        {trip.status !== RecurringTripStatus.Cancelled && (
          <div className="flex flex-wrap gap-2">
            {trip.status === RecurringTripStatus.Active ? (
              <Button variant="secondary" onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending}>
                {t('recurring.pause')}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => resumeMutation.mutate()} disabled={resumeMutation.isPending}>
                {t('recurring.resume')}
              </Button>
            )}
            <Button variant="ghost" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              {t('recurring.cancelTrip')}
            </Button>
          </div>
        )}

        {pendingSubs.length > 0 && (
          <div className="mt-2 space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-medium text-slate-500">{t('recurring.pendingSubscribers')}</p>
            {pendingSubs.map((sub) => (
              <div key={sub._id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-600">
                  {sub.seats} {t('ride.seats')} ·{' '}
                  {sub.scheduleDays === null ? t('recurring.allDays') : sub.scheduleDays.map((d) => t(`recurring.days.${d}`)).join('، ')}
                </span>
                <div className="flex gap-1">
                  <Button variant="secondary" onClick={() => approveMutation.mutate(sub._id)} disabled={approveMutation.isPending}>
                    {t('recurring.approveSubscription')}
                  </Button>
                  <Button variant="ghost" onClick={() => rejectMutation.mutate(sub._id)} disabled={rejectMutation.isPending}>
                    {t('recurring.rejectSubscription')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export function MyRidesPage() {
  const { t } = useTranslation();

  const { data: rides = [], isLoading: ridesLoading } = useQuery({
    queryKey: ['rides', 'mine'],
    queryFn: async () => {
      try {
        const { data } = await ridesApi.getMine();
        return data.length > 0 ? (data as RideWithDetails[]) : (DEMO_RIDES.slice(0, 2) as RideWithDetails[]);
      } catch {
        return DEMO_RIDES.slice(0, 2) as RideWithDetails[];
      }
    },
  });

  const { data: recurringTrips = [], isLoading: recurringLoading } = useQuery<RecurringTrip[]>({
    queryKey: ['recurring-trips', 'mine'],
    queryFn: async () => {
      try {
        const { data } = await recurringTripsApi.getMine();
        return data;
      } catch {
        return [];
      }
    },
  });

  const activeRecurring = recurringTrips.filter((t) => t.status !== RecurringTripStatus.Cancelled);
  const isLoading = ridesLoading || recurringLoading;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('driver.myRides')}</h2>
        <Link to="/driver/rides/new"><Button>{t('driver.createRide')}</Button></Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          {activeRecurring.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-700">🔁 {t('recurring.myRecurringTrips')}</h3>
              {activeRecurring.map((trip) => (
                <RecurringTripCard key={trip._id} trip={trip} />
              ))}
            </div>
          )}

          <div className="space-y-4">
            {activeRecurring.length > 0 && (
              <h3 className="text-base font-semibold text-slate-700">{t('driver.myRides')}</h3>
            )}
            {rides.length === 0 ? (
              <EmptyState
                title={t('driver.noRides')}
                description={t('driver.createFirst')}
                actionLabel={t('driver.createRide')}
                actionTo="/driver/rides/new"
              />
            ) : (
              rides.map((ride) => <RideCard key={ride._id} ride={ride} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
