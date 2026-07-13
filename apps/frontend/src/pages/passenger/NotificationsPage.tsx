import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/EmptyState';

export function NotificationsPage() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon="🔔"
      title={t('passenger.notificationsTitle')}
      description={t('passenger.notificationsEmpty')}
    />
  );
}
