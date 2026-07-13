import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RideSearchForm } from '@/components/RideSearchForm';
import { HowItWorks } from '@/components/HowItWorks';
import { RideCard } from '@/components/RideCard';
import { Spinner } from '@/components/ui';
import { useCities } from '@/hooks/useCities';
import { DEMO_RIDES } from '@/data/demo';
import { Button } from '@wasslni/shared-ui';

export function HomePage() {
  const { t } = useTranslation();
  const { data: cities = [], isLoading } = useCities();
  const featuredRides = DEMO_RIDES.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">{t('home.title')}</h1>
            <p className="mt-4 text-lg text-emerald-50 md:text-xl">{t('home.subtitle')}</p>
          </div>

          <div className="mt-8">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner className="border-white/30 border-t-white" />
              </div>
            ) : (
              <RideSearchForm cities={cities} />
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <HowItWorks />
      </section>

      {/* Featured rides */}
      <section className="border-t border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">{t('home.popularRoutes')}</h2>
          <div className="space-y-4">
            {featuredRides.map((ride) => (
              <RideCard key={ride._id} ride={ride} />
            ))}
          </div>
        </div>
      </section>

      {/* Driver CTA */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-slate-900 px-8 py-10 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold">{t('home.driverCta')}</h2>
            <p className="mt-2 text-slate-300">{t('home.driverCtaDesc')}</p>
          </div>
          <Link to="/register">
            <Button className="bg-emerald-500 hover:bg-emerald-400">{t('home.driverCtaButton')}</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
