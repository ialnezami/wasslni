import { Navigate } from 'react-router-dom';
import { UserRole } from '@wasslni/shared-types';
import { useAuthStore } from '@/store/auth.store';

export function DashboardRedirect() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === UserRole.Admin) {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/app" replace />;
}
