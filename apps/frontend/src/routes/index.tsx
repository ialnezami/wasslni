import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { UserRole } from '@wasslni/shared-types';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DriverLayout } from '@/layouts/DriverLayout';
import { PassengerLayout } from '@/layouts/PassengerLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { DashboardRedirect } from '@/routes/DashboardRedirect';
import { HomePage } from '@/pages/public/HomePage';
import { SearchPage } from '@/pages/public/SearchPage';
import { RideDetailsPage } from '@/pages/public/RideDetailsPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { PassengerDashboardPage } from '@/pages/passenger/PassengerDashboardPage';
import { BookingsPage } from '@/pages/passenger/BookingsPage';
import { ProfilePage } from '@/pages/passenger/ProfilePage';
import { NotificationsPage } from '@/pages/passenger/NotificationsPage';
import { ReviewsPage } from '@/pages/passenger/ReviewsPage';
import { DriverDashboardPage } from '@/pages/driver/DriverDashboardPage';
import { MyRidesPage } from '@/pages/driver/MyRidesPage';
import { CreateRidePage } from '@/pages/driver/CreateRidePage';
import { DriverBookingsPage } from '@/pages/driver/DriverBookingsPage';
import { VehiclesPage } from '@/pages/driver/VehiclesPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { UsersPage } from '@/pages/admin/UsersPage';
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

        <Route element={<ProtectedRoute allowedRoles={[UserRole.Passenger]} />}>
          <Route path="passenger" element={<PassengerLayout />}>
            <Route index element={<PassengerDashboardPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="reviews" element={<ReviewsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[UserRole.Driver]} />}>
          <Route path="driver" element={<DriverLayout />}>
            <Route index element={<DriverDashboardPage />} />
            <Route path="rides" element={<MyRidesPage />} />
            <Route path="rides/new" element={<CreateRidePage />} />
            <Route path="bookings" element={<DriverBookingsPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[UserRole.Admin]} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="cities" element={<PlaceholderPage title="Cities" />} />
            <Route path="trips" element={<PlaceholderPage title="Trips" />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
