import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, LogOut } from 'lucide-react';
import { Button } from '@wasslni/shared-ui';
import { useAuthStore } from '@/store/auth.store';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/utils/format';

export function PublicLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuthStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLink = (to: string, label: string, mobile = false) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      className={cn(
        'rounded-xl font-medium transition',
        mobile
          ? 'block px-4 py-3 text-base'
          : 'px-3 py-2 text-sm',
        location.pathname === to
          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {t('app.name')}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLink('/', t('nav.home'))}
            {navLink('/search', t('nav.search'))}
            {navLink('/about', t('nav.about'))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />

            {isAuthenticated ? (
              <>
                <Link
                  to="/app"
                  className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 sm:block"
                >
                  {user?.fullName}
                </Link>
                <Link to="/app" className="hidden sm:block">
                  <Button variant="ghost">{t('nav.dashboard')}</Button>
                </Link>
                <button
                  onClick={logout}
                  aria-label={t('nav.logout')}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                </button>
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

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="القائمة"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 md:hidden">
            <nav className="flex flex-col gap-1">
              {navLink('/', t('nav.home'), true)}
              {navLink('/search', t('nav.search'), true)}
              {navLink('/about', t('nav.about'), true)}
              {isAuthenticated && navLink('/app', t('nav.dashboard'), true)}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-slate-600 dark:text-slate-400 md:flex-row md:text-start">
          <div>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{t('app.name')}</p>
            <p>{t('footer.tagline')}</p>
          </div>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              {t('nav.about')}
            </Link>
            <Link to="/contact" className="hover:text-emerald-600 dark:hover:text-emerald-400">
              {t('nav.contact')}
            </Link>
          </div>
          <p>© 2026 {t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
}
