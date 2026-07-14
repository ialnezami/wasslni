import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import { HowItWorks } from '@/components/HowItWorks';

export function AboutPage() {
  const { t } = useTranslation();

  const values = [
    { icon: '🌿', key: 'environment' },
    { icon: '🤝', key: 'solidarity' },
    { icon: '💰', key: 'savings' },
    { icon: '🛡️', key: 'trust' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">{t('about.title')}</h1>
        <p className="mt-3 text-lg text-slate-600">{t('about.subtitle')}</p>
      </div>

      <Card padding="lg">
        <h2 className="mb-3 text-xl font-semibold text-slate-900">{t('about.missionTitle')}</h2>
        <p className="leading-relaxed text-slate-700">{t('about.missionBody')}</p>
      </Card>

      <div>
        <h2 className="mb-6 text-center text-xl font-semibold text-slate-900">{t('about.valuesTitle')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map(({ icon, key }) => (
            <Card key={key} padding="md">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-900">{t(`about.value_${key}_title`)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(`about.value_${key}_body`)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <HowItWorks />
    </div>
  );
}
