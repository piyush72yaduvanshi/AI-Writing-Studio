import apiClient from './client';
import { ApiResponse } from '../types/auth';
import { AIOperationPayload, AIResponseData, AIRequestLog, AIConfig } from '../types/ai';

export const aiApi = {
  executeAction: async (action: string, payload: AIOperationPayload): Promise<AIResponseData> => {
    // Check if dedicated endpoint exists, otherwise fallback to dispatch endpoint
    const dedicatedEndpoints: Record<string, string> = {
      improve: '/ai/improve',
      fix_grammar: '/ai/grammar',
      translate: '/ai/translate',
      rewrite: '/ai/rewrite',
      expand: '/ai/expand',
      shorten: '/ai/shorten',
      generate_outline: '/ai/structure',
      convert_to_screenplay: '/ai/screenplay',
      convert_to_story: '/ai/story',
    };

    const endpoint = dedicatedEndpoints[action] || '/ai/action';

    const activeProvider = payload.provider || localStorage.getItem('custom_ai_provider') || undefined;
    let apiKey = payload.api_key;
    if (!apiKey) {
      if (activeProvider === 'gemini') apiKey = localStorage.getItem('custom_gemini_key') || undefined;
      else if (activeProvider === 'openrouter') apiKey = localStorage.getItem('custom_openrouter_key') || undefined;
      else if (activeProvider === 'openai') apiKey = localStorage.getItem('custom_openai_key') || undefined;
    }

    let model = payload.model;
    if (!model) {
      if (activeProvider === 'openrouter') model = localStorage.getItem('custom_openrouter_model') || 'deepseek/deepseek-chat';
      else if (activeProvider === 'gemini') model = localStorage.getItem('custom_gemini_model') || undefined;
      else if (activeProvider === 'openai') model = localStorage.getItem('custom_openai_model') || undefined;
    }

    const basePayload = endpoint === '/ai/action' ? { ...payload, action } : payload;
    const body = {
      ...basePayload,
      ...(activeProvider && activeProvider !== 'auto' ? { provider: activeProvider } : {}),
      ...(model ? { model } : {}),
      ...(apiKey ? { api_key: apiKey } : {}),
    };

    const res = await apiClient.post<ApiResponse<AIResponseData>>(endpoint, body);
    return res.data.data;
  },

  queueAsyncAction: async (action: string, payload: AIOperationPayload): Promise<{ task_id: string; status: string }> => {
    const activeProvider = payload.provider || localStorage.getItem('custom_ai_provider') || undefined;
    let apiKey = payload.api_key;
    if (!apiKey) {
      if (activeProvider === 'gemini') apiKey = localStorage.getItem('custom_gemini_key') || undefined;
      else if (activeProvider === 'openrouter') apiKey = localStorage.getItem('custom_openrouter_key') || undefined;
      else if (activeProvider === 'openai') apiKey = localStorage.getItem('custom_openai_key') || undefined;
    }

    let model = payload.model;
    if (!model) {
      if (activeProvider === 'openrouter') model = localStorage.getItem('custom_openrouter_model') || 'deepseek/deepseek-chat';
      else if (activeProvider === 'gemini') model = localStorage.getItem('custom_gemini_model') || undefined;
      else if (activeProvider === 'openai') model = localStorage.getItem('custom_openai_model') || undefined;
    }

    const body = {
      ...payload,
      action,
      ...(activeProvider && activeProvider !== 'auto' ? { provider: activeProvider } : {}),
      ...(model ? { model } : {}),
      ...(apiKey ? { api_key: apiKey } : {}),
    };

    const res = await apiClient.post<ApiResponse<{ task_id: string; status: string }>>('/ai/async/', body);
    return res.data.data;
  },

  getTaskStatus: async (taskId: string): Promise<{ task_id: string; status: string; data?: AIResponseData; error?: string }> => {
    const res = await apiClient.get<ApiResponse<{ task_id: string; status: string; data?: AIResponseData; error?: string }>>(`/ai/tasks/${taskId}/`);
    return res.data.data;
  },

  getHistory: async (): Promise<AIRequestLog[]> => {
    const res = await apiClient.get<ApiResponse<AIRequestLog[]>>('/ai/history');
    return res.data.data;
  },

  getConfig: async (): Promise<AIConfig> => {
    const res = await apiClient.get<ApiResponse<AIConfig>>('/ai/config');
    return res.data.data;
  },
};
