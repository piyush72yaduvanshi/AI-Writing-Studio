import apiClient from './client';
import { ApiResponse } from '../types/auth';
import { WritingReference } from '../types/reference';

export const referencesApi = {
  list: async (category?: string): Promise<WritingReference[]> => {
    const res = await apiClient.get<ApiResponse<WritingReference[]>>('/references/', {
      params: category ? { category } : undefined,
    });
    return res.data.data;
  },

  create: async (formData: FormData): Promise<WritingReference> => {
    const res = await apiClient.post<ApiResponse<WritingReference>>('/references/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/references/${id}`);
  },

  reindex: async (id: string): Promise<WritingReference> => {
    const res = await apiClient.post<ApiResponse<WritingReference>>(`/references/${id}/index`);
    return res.data.data;
  },
};
