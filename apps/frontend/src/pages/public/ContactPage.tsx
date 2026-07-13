import { useTranslation } from 'react-i18next';
import { Card, Input } from '@/components/ui';
import { Button } from '@wasslni/shared-ui';

export function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">{t('nav.contact')}</h1>
      <p className="mt-2 text-slate-600">{t('app.tagline')}</p>

      <Card className="mt-8 space-y-4">
        <Input label={t('auth.fullName')} name="name" />
        <Input type="email" label={t('auth.email')} name="email" />
        <Input label="Message" name="message" />
        <Button className="w-full">{t('common.save')}</Button>
      </Card>
    </div>
  );
}
