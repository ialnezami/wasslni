import type { AuthUser } from '@wasslni/shared-types';
import { UserRole } from '@wasslni/shared-types';
import { authApi } from '@/api/auth';
import { DEMO_USERS } from '@/data/demo';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends LoginPayload {
  fullName: string;
  phone: string;
  role: UserRole;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

function tryDemoLogin(email: string, password: string): AuthResult | null {
  const accounts = [DEMO_USERS.passenger, DEMO_USERS.driver];
  const match = accounts.find(
    (a) => a.email === email.toLowerCase() && a.password === password,
  );
  if (!match) return null;
  return { user: match.user, accessToken: match.accessToken, refreshToken: 'demo-refresh' };
}

function tryDemoRegister(payload: RegisterPayload): AuthResult {
  return {
    user: {
      userId: `demo-${Date.now()}`,
      role: payload.role,
      email: payload.email,
      fullName: payload.fullName,
    },
    accessToken: `demo-token-${Date.now()}`,
    refreshToken: 'demo-refresh',
  };
}

export async function loginUser(payload: LoginPayload): Promise<AuthResult> {
  const demo = tryDemoLogin(payload.email, payload.password);
  if (demo) return demo;

  try {
    const { data } = await authApi.login(payload);
    return data;
  } catch {
    throw new Error('Invalid credentials');
  }
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResult> {
  const demo = tryDemoLogin(payload.email, payload.password);
  if (demo) return demo;

  try {
    const { data } = await authApi.register(payload);
    return data;
  } catch {
    return tryDemoRegister(payload);
  }
}
