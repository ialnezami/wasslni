import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { UserRole } from '@wasslni/shared-types';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { UserLayout } from '@/layouts/UserLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { DashboardRedirect } from '@/routes/DashboardRedirect';
import { HomePage } from '@/pages/public/HomePage';
import { SearchPage } from '@/pages/public/SearchPage';
import { RideDetailsPage } from '@/pages/public/RideDetailsPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { MyRidesPage } from '@/pages/driver/MyRidesPage';
import { CreateRidePage } from '@/pages/driver/CreateRidePage';
import { DriverBookingsPage } from '@/pages/driver/DriverBookingsPage';
import { VehiclesPage } from '@/pages/driver/VehiclesPage';
import { BookingsPage } from '@/pages/passenger/BookingsPage';
import { ProfilePage } from '@/pages/passenger/ProfilePage';
import { NotificationsPage } from '@/pages/passenger/NotificationsPage';
import { ReviewsPage } from '@/pages/passenger/ReviewsPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage';
import { AdminReviewsPage } from '@/pages/admin/AdminReviewsPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="rides/:id" element={<RideDetailsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardRedirect />} />
        </Route>

        <Route path="passenger/*" element={<Navigate to="/app" replace />} />
        <Route path="driver/*" element={<Navigate to="/app" replace />} />

        <Route element={<ProtectedRoute allowedRoles={[UserRole.User]} />}>
          <Route path="app" element={<UserLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="my-rides" element={<MyRidesPage />} />
            <Route path="create-ride" element={<CreateRidePage />} />
            <Route path="booking-requests" element={<DriverBookingsPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="reviews" element={<ReviewsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[UserRole.Admin]} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="cities" element={<PlaceholderPage title="Cities" />} />
            <Route path="trips" element={<PlaceholderPage title="Trips" />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
