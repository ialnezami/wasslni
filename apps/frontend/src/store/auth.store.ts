import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@wasslni/shared-types';
import { updateSocketAuth } from '@/lib/socket';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;   // memory only — not persisted
  refreshToken: string | null;  // persisted for session restore on page reload
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string, refreshToken?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setAccessToken: (accessToken, refreshToken) => {
        set((s) => ({ accessToken, refreshToken: refreshToken ?? s.refreshToken }));
        if (accessToken) updateSocketAuth(accessToken);
      },
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'wasslni-auth',
      // accessToken intentionally excluded — stays in memory only, not in localStorage
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
