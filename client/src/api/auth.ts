import { fetchApi } from './fetcher';
import { type User } from '../context/AuthContext';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
}

export interface AuthResponse {
  message?: string;
  token: string;
  user: User;
}

export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return fetchApi<AuthResponse>('/api/users/login', {
    method: 'POST',
    body: credentials,
  });
};

export const registerApi = async (credentials: RegisterCredentials): Promise<User> => {
  return fetchApi<User>('/api/users/register', {
    method: 'POST',
    body: credentials,
  });
};