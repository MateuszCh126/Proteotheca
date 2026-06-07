import { apiJson } from './client';

export interface User {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
  created_at: string;
  last_active_at?: string | null;
}

export interface AuthResponse {
  user: User;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiJson<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: LoginPayload) =>
    apiJson<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiJson<{ message: string }>('/api/auth/logout', { method: 'POST' }),
  me: () => apiJson<User>('/api/auth/me'),
};
