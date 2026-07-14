import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Card, Spinner } from '@/components/ui';

interface ReviewUser {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface Review {
  _id: string;
  reviewerId: ReviewUser;
  revieweeId: ReviewUser;
  rideId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export function AdminReviewsPage() {
  const { t } = useTranslation();

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['admin', 'reviews'],
    queryFn: () => apiClient.get<Review[]>('/admin/reviews').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('admin.reviews')}</h2>
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : reviews.length === 0 ? (
        <p className="py-12 text-center text-slate-500">{t('admin.noReviews')}</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r: Review) => (
            <Card key={r._id}>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <StarRating rating={r.rating} />
                  <p className="text-xs text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString('ar')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>
                    <span className="text-slate-500">{t('admin.reviewer')}: </span>
                    <span className="font-medium">{r.reviewerId?.fullName ?? '—'}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">{t('admin.reviewee')}: </span>
                    <span className="font-medium">{r.revieweeId?.fullName ?? '—'}</span>
                  </p>
                </div>
                {r.comment && (
                  <p className="text-sm text-slate-600 border-t pt-2">{r.comment}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
