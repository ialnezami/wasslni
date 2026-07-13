import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@wasslni/shared-ui';
import { useAuthStore } from '@/store/auth.store';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/utils/format';

export function PublicLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuthStore();
  const location = useLocation();

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={cn(
        'rounded-lg px-3 py-2 text-sm font-medium transition',
        location.pathname === to
          ? 'bg-emerald-50 text-emerald-800'
          : 'text-slate-700 hover:bg-slate-100',
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-xl font-bold text-emerald-700">
            {t('app.name')}
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLink('/', t('nav.home'))}
            {navLink('/search', t('nav.search'))}
            {navLink('/about', t('nav.about'))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="hidden text-sm text-slate-700 sm:block">
                  {user?.fullName}
                </Link>
                <Link to="/dashboard">
                  <Button variant="ghost" className="hidden sm:inline-flex">
                    {t('nav.dashboard')}
                  </Button>
                </Link>
                <Button variant="ghost" onClick={logout}>
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost">{t('nav.login')}</Button>
                </Link>
                <Link to="/register">
                  <Button>{t('nav.register')}</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-slate-600 md:flex-row md:text-start">
          <div>
            <p className="font-semibold text-emerald-700">{t('app.name')}</p>
            <p>{t('footer.tagline')}</p>
          </div>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-emerald-700">
              {t('nav.about')}
            </Link>
            <Link to="/contact" className="hover:text-emerald-700">
              {t('nav.contact')}
            </Link>
          </div>
          <p>© 2026 {t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
}
