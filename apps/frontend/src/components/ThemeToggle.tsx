import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggle } = useThemeStore();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
      className={[
        'flex h-9 w-9 items-center justify-center rounded-xl transition',
        'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
