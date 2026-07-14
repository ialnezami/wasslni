import { Navigate, Outlet } from 'react-router-dom';
import { UserRole } from '@wasslni/shared-types';
import { useAuthStore } from '@/store/auth.store';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Stale or mismatched role (e.g. after enum migration) — force re-login
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
