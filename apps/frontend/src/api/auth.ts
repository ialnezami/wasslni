import apiClient from './client';
import type { AuthTokens, AuthUser } from '@wasslni/shared-types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  fullName: string;
  phone: string;
  role: AuthUser['role'];
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthTokens & { user: AuthUser }>('/auth/login', payload),
  register: (payload: RegisterPayload) =>
    apiClient.post<AuthTokens & { user: AuthUser }>('/auth/register', payload),
  logout: () => apiClient.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }),
};
