import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';

const steps = [
  { icon: '🔍', titleKey: 'home.step1Title', descKey: 'home.step1Desc' },
  { icon: '📋', titleKey: 'home.step2Title', descKey: 'home.step2Desc' },
  { icon: '🚗', titleKey: 'home.step3Title', descKey: 'home.step3Desc' },
] as const;

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <h2 className="text-center text-2xl font-bold text-slate-900">{t('home.howItWorks')}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <Card key={step.titleKey} className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              {step.icon}
            </div>
            <p className="mb-1 text-xs font-medium text-emerald-700">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="font-semibold text-slate-900">{t(step.titleKey)}</h3>
            <p className="mt-2 text-sm text-slate-600">{t(step.descKey)}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
