import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import { HowItWorks } from '@/components/HowItWorks';

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">{t('nav.about')}</h1>
        <p className="mt-3 text-lg text-slate-600">{t('app.tagline')}</p>
      </div>
      <Card padding="lg">
        <p className="leading-relaxed text-slate-700">
          {t('home.subtitle')}
        </p>
      </Card>
      <HowItWorks />
    </div>
  );
}
