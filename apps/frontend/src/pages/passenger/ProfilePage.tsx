import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { Card } from '@/components/ui';

export function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('passenger.profileTitle')}</h2>
      <Card>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-slate-500">{t('auth.fullName')}</dt>
            <dd className="font-medium">{user?.fullName}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">{t('auth.email')}</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">{t('auth.role')}</dt>
            <dd className="font-medium">{user?.role}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
