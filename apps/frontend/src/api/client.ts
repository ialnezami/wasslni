import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);

    const { refreshToken, setAccessToken, logout } = useAuthStore.getState();
    if (!refreshToken) { logout(); return Promise.reject(error); }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await apiClient.post<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        { refreshToken },
      );
      setAccessToken(data.accessToken, data.refreshToken);
      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(original);
    } catch (err) {
      processQueue(err, null);
      logout();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
