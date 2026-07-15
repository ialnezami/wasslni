import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@wasslni/shared-ui';
import { useRide, isDemoRide } from '@/hooks/useRides';
import { useAuthStore } from '@/store/auth.store';
import { bookingsApi } from '@/api/bookings';
import { formatDate, formatPrice } from '@/utils/format';
import { Card, Badge, Spinner, Alert, Select } from '@/components/ui';

export function RideDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: ride, isLoading, isError } = useRide(id ?? '');
  const { isAuthenticated } = useAuthStore();
  const [seats, setSeats] = useState(1);
  const [booked, setBooked] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const bookingMutation = useMutation({
    mutationFn: () => bookingsApi.create(ride!._id, seats),
    onSuccess: () => {
      setBookingError(null);
      setBooked(true);
      queryClient.invalidateQueries({ queryKey: ['bookings', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['ride', id] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
    onError: () => {
      setBookingError(t('ride.bookingError'));
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (isError || !ride) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">{t('ride.notFound')}</p>
        <Link to="/search" className="mt-4 inline-block text-emerald-700 hover:underline">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const handleBook = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/rides/${id}` } });
      return;
    }
    setBookingError(null);
    bookingMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/search" className="text-sm text-emerald-700 hover:underline">
        ← {t('common.back')}
      </Link>

      <div className="mt-4 space-y-6">
        {booked && (
          <Alert variant="success">{t('ride.bookingSuccess')}</Alert>
        )}
        {bookingError && <Alert variant="error">{bookingError}</Alert>}

        <Card padding="lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge variant="success">
                {ride.availableSeats} {t('ride.seatsAvailable')}
              </Badge>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">
                {ride.departureCityName} → {ride.destinationCityName}
              </h1>
              <p className="mt-1 text-slate-600">
                {formatDate(ride.date, i18n.language)} · {ride.departureTime}
              </p>
            </div>
            <div className="text-end">
              <p className="text-3xl font-bold text-emerald-700">
                {formatPrice(ride.price, i18n.language)}
              </p>
              <p className="text-sm text-slate-500">{t('common.perSeat')}</p>
            </div>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500">{t('ride.departure')}</dt>
              <dd className="font-medium">{ride.departurePoint}</dd>
            </div>
            {ride.destinationPoint && (
              <div>
                <dt className="text-sm text-slate-500">{t('ride.destination')}</dt>
                <dd className="font-medium">{ride.destinationPoint}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-slate-500">{t('ride.driver')}</dt>
              <dd className="font-medium">
                {ride.driverName ?? '—'}{ride.driverRating != null ? ` · ★ ${ride.driverRating.toFixed(1)}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">{t('ride.seats')}</dt>
              <dd className="font-medium">
                {ride.availableSeats} / {ride.totalSeats}
              </dd>
            </div>
          </dl>

          {ride.description && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">{t('ride.description')}</p>
              <p className="mt-1 text-slate-800">{ride.description}</p>
            </div>
          )}
        </Card>

        {!booked && (
          <Card>
            {isDemoRide(ride._id) ? (
              <p className="text-center text-sm text-slate-500">{t('ride.demoNotBookable')}</p>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Select
                    label={t('ride.bookSeats')}
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                  >
                    {Array.from({ length: Math.min(ride.availableSeats, 4) }, (_, i) => i + 1).map(
                      (n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ),
                    )}
                  </Select>
                </div>
                <Button
                  onClick={handleBook}
                  disabled={bookingMutation.isPending}
                  className="w-full py-3 text-base sm:w-auto sm:min-w-[200px]"
                >
                  {bookingMutation.isPending
                    ? t('common.loading')
                    : isAuthenticated
                      ? t('ride.book')
                      : t('ride.loginToBook')}
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
