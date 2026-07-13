import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { UserRole } from '@wasslni/shared-types';
import { Button } from '@wasslni/shared-ui';
import { Input, Alert, Card, Select } from '@/components/ui';
import { registerUser } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: UserRole.Passenger,
    },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const result = await registerUser(data);
      setAuth(result.user, result.accessToken, result.refreshToken);
      navigate('/dashboard', { replace: true });
    } catch {
      setError(t('common.error'));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card padding="lg">
        <h1 className="text-2xl font-bold text-slate-900">{t('auth.registerTitle')}</h1>
        <p className="mt-1 text-slate-600">{t('auth.registerSubtitle')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            label={t('auth.fullName')}
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            type="email"
            label={t('auth.email')}
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            type="tel"
            label={t('auth.phone')}
            autoComplete="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            type="password"
            label={t('auth.password')}
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Select label={t('auth.role')} error={errors.role?.message} {...register('role')}>
            <option value={UserRole.Passenger}>{t('auth.rolePassenger')}</option>
            <option value={UserRole.Driver}>{t('auth.roleDriver')}</option>
          </Select>

          <Button type="submit" disabled={isSubmitting} className="w-full py-3">
            {t('auth.registerButton')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="font-medium text-emerald-700 hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
