import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from '@/routes';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

const queryClient = new QueryClient();

function AppInner() {
  useUnreadNotifications();
  return <AppRoutes />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
