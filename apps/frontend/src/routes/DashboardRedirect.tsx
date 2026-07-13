import { Navigate } from 'react-router-dom';
import { UserRole } from '@wasslni/shared-types';
import { useAuthStore } from '@/store/auth.store';

export function DashboardRedirect() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case UserRole.Admin:
      return <Navigate to="/admin" replace />;
    case UserRole.Driver:
      return <Navigate to="/driver" replace />;
    case UserRole.Passenger:
    default:
      return <Navigate to="/passenger" replace />;
  }
}
