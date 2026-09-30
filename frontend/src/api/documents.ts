import apiClient from './client';
import { ApiResponse } from '../types/auth';
import { DocumentItem, DocumentVersion, PaginatedResult } from '../types/document';

export const documentsApi = {
  list: async (params?: {
    search?: string;
    mode?: string;
    language?: string;
    sort_by?: string;
    page?: number;
  }): Promise<PaginatedResult<DocumentItem>> => {
    const res = await apiClient.get<ApiResponse<PaginatedResult<DocumentItem>>>('/documents/', { params });
    return res.data.data;
  },

  get: async (id: string): Promise<DocumentItem> => {
    const res = await apiClient.get<ApiResponse<DocumentItem>>(`/documents/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<DocumentItem>): Promise<DocumentItem> => {
    const res = await apiClient.post<ApiResponse<DocumentItem>>('/documents/', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<DocumentItem>): Promise<DocumentItem> => {
    const res = await apiClient.patch<ApiResponse<DocumentItem>>(`/documents/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },

  duplicate: async (id: string): Promise<DocumentItem> => {
    const res = await apiClient.post<ApiResponse<DocumentItem>>(`/documents/${id}/duplicate`);
    return res.data.data;
  },

  listVersions: async (id: string): Promise<DocumentVersion[]> => {
    const res = await apiClient.get<ApiResponse<DocumentVersion[]>>(`/documents/${id}/versions`);
    return res.data.data;
  },

  createVersion: async (id: string, change_summary: string): Promise<DocumentVersion> => {
    const res = await apiClient.post<ApiResponse<DocumentVersion>>(`/documents/${id}/versions`, { change_summary });
    return res.data.data;
  },

  restoreVersion: async (id: string, versionId: string): Promise<DocumentItem> => {
    const res = await apiClient.post<ApiResponse<DocumentItem>>(`/documents/${id}/restore/${versionId}`);
    return res.data.data;
  },
};
