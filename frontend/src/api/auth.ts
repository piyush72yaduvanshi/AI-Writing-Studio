import apiClient from './client';
import { ApiResponse, AuthResponseData, User } from '../types/auth';

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponseData> => {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', credentials);
    return res.data.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    username?: string;
    preferred_language?: string;
    preferred_tone?: string;
  }): Promise<AuthResponseData> => {
    const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', userData);
    return res.data.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },

  updateMe: async (userData: Partial<User>): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>('/auth/me', userData);
    return res.data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refresh: refreshToken });
  },
};
