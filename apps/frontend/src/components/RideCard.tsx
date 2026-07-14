import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@wasslni/shared-ui';
import type { RideWithDetails } from '@/data/demo';
import { formatPrice, formatShortDate } from '@/utils/format';
import { Card, Badge } from '@/components/ui';

interface RideCardProps {
  ride: RideWithDetails;
}

export function RideCard({ ride }: RideCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <Card className="transition hover:border-emerald-200 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">
              {ride.availableSeats} {t('ride.seatsAvailable')}
            </Badge>
            <span className="text-sm text-slate-500">
              {formatShortDate(ride.date, i18n.language)} · {ride.departureTime}
            </span>
          </div>

          <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
            <span>{ride.departureCityName}</span>
            <span className="text-emerald-600" aria-hidden="true">
              ←
            </span>
            <span>{ride.destinationCityName}</span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>{ride.departurePoint}</span>
            <span>·</span>
            <span>
              {ride.driverName ?? '—'}{ride.driverRating != null ? ` · ★ ${ride.driverRating.toFixed(1)}` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
          <p className="text-2xl font-bold text-emerald-700">
            {formatPrice(ride.price, i18n.language)}
          </p>
          <Link to={`/rides/${ride._id}`}>
            <Button className="min-w-[120px]">{t('ride.viewDetails')}</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
