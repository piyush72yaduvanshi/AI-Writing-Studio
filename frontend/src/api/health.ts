import apiClient from './client';

export interface HealthStatus {
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  environment: string;
  services: {
    database?: { status: string; type?: string; error?: string };
    redis?: { status: string; error?: string };
    ai_providers?: {
      gemini?: { status: string; model?: string };
      openrouter?: { status: string; model?: string };
      openai?: { status: string; model?: string };
      ollama?: {
        status: string;
        base_url?: string;
        available_models?: string[];
        note?: string;
      };
      warning?: string;
    };
    ollama?: {
      status: string;
      base_url?: string;
      configured_model?: string;
      model_loaded?: boolean;
      available_models?: string[];
      error?: string;
    };
    qdrant?: { status: string; url?: string; error?: string };
  };
}

export const healthApi = {
  check: async (): Promise<HealthStatus> => {
    const res = await apiClient.get<HealthStatus>('/health/');
    return res.data;
  },
};
