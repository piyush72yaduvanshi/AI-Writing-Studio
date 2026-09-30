import axios, { AxiosError } from 'axios';
import { ApiResponse } from '../types/auth';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Refresh Token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refresh: refreshToken });
          if (res.data?.success && res.data?.data?.access) {
            const newAccess = res.data.data.access;
            localStorage.setItem('access_token', newAccess);
            if (res.data.data.refresh) {
              localStorage.setItem('refresh_token', res.data.data.refresh);
            }
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      }
    }

    // Extract clean human-readable error message
    const customMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(customMessage));
  }
);

export default apiClient;
