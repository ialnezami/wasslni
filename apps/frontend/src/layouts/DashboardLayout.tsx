import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@wasslni/shared-ui';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/utils/format';

interface DashboardLayoutProps {
  title: string;
  links: Array<{ to: string; label: string; dividerBefore?: boolean }>;
}

export function DashboardLayout({ title, links }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <Link to="/" className="text-sm font-medium text-emerald-700">
              {t('app.name')}
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {user && (
              <p className="text-sm text-slate-500">{user.fullName}</p>
            )}
          </div>
          <Button variant="ghost" onClick={logout}>
            {t('nav.logout')}
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Mobile nav */}
        <nav className="mb-4 flex gap-2 overflow-x-auto pb-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-sm font-medium',
                location.pathname === link.to
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 md:block">
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <div key={link.to}>
                  {link.dividerBefore && <hr className="my-2 border-slate-100" />}
                  <Link
                    to={link.to}
                    className={cn(
                      'block rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      location.pathname === link.to
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </nav>
          </aside>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}
