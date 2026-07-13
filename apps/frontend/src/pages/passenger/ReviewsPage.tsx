import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/EmptyState';

export function ReviewsPage() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon="⭐"
      title={t('passenger.reviewsTitle')}
      description={t('passenger.notificationsEmpty')}
    />
  );
}
