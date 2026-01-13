import apiClient from './client';
import { User, AuthResponse } from '../../../shared/src/types';

export const authApi = {
  login: async (username: string, password: string): Promise<User> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      username,
      password,
    });
    return response.data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<AuthResponse>('/auth/me');
    return response.data.user;
  },
};
