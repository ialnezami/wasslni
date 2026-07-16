import type { ComponentType } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/utils/format';

export interface NavLink {
  to: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  dividerBefore?: boolean;
  bottomNav?: boolean;
}

interface DashboardLayoutProps {
  title: string;
  links: NavLink[];
}

export function DashboardLayout({ title, links }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  const bottomLinks = links.filter((l) => l.bottomNav);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <Link to="/" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {t('app.name')}
            </Link>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
            {user && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.fullName}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={logout}
              aria-label={t('nav.logout')}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-6">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          {/* Desktop sidebar */}
          <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:block">
            <nav className="flex flex-col gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const active = location.pathname === link.to;
                return (
                  <div key={link.to}>
                    {link.dividerBefore && (
                      <hr className="my-2 border-slate-100 dark:border-slate-800" />
                    )}
                    <Link
                      to={link.to}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                        active
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800',
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      {link.label}
                    </Link>
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:p-6">
            <Outlet />
          </section>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      {bottomLinks.length > 0 && (
        <nav className="fixed bottom-0 start-0 end-0 z-50 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:hidden">
          <div className="flex items-center justify-around px-2 py-2">
            {bottomLinks.map((link) => {
              const Icon = link.icon;
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition',
                    active
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500 dark:text-slate-400',
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        active && 'text-emerald-600 dark:text-emerald-400',
                      )}
                    />
                  )}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
