import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@wasslni/shared-ui';
import { Input, Alert, Card } from '@/components/ui';
import { loginUser } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const result = await loginUser(data);
      setAuth(result.user, result.accessToken, result.refreshToken);
      navigate(from, { replace: true });
    } catch {
      setError(t('auth.invalidCredentials'));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card padding="lg">
        <h1 className="text-2xl font-bold text-slate-900">{t('auth.loginTitle')}</h1>
        <p className="mt-1 text-slate-600">{t('auth.loginSubtitle')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            type="email"
            label={t('auth.email')}
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            type="password"
            label={t('auth.password')}
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full py-3">
            {t('auth.loginButton')}
          </Button>
        </form>

        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          {t('auth.demoHint')}
        </p>

        <p className="mt-6 text-center text-sm text-slate-600">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-emerald-700 hover:underline">
            {t('nav.register')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
