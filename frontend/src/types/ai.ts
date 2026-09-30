import { WritingMode, WritingLanguage, WritingTone } from './document';

export type AIAction = 
  | 'improve'
  | 'fix_grammar'
  | 'simplify'
  | 'expand'
  | 'shorten'
  | 'translate'
  | 'change_tone'
  | 'rewrite'
  | 'summarize'
  | 'generate_title'
  | 'generate_intro'
  | 'generate_conclusion'
  | 'generate_outline'
  | 'convert_to_blog'
  | 'convert_to_story'
  | 'convert_to_screenplay';

export interface AIOperationPayload {
  content: string;
  document_id?: string | null;
  action?: string;
  mode?: WritingMode;
  language?: WritingLanguage;
  tone?: WritingTone;
  custom_instruction?: string;
  use_rag?: boolean;
  save_version?: boolean;
  provider?: string;
  model?: string;
  api_key?: string;
}

export interface AIResponseData {
  content: string;
  action: string;
  model: string;
  provider?: string;
  duration_ms: number;
  input_tokens: number;
  output_tokens: number;
  cached: boolean;
  document_id?: string | null;
}

export interface AIRequestLog {
  id: string;
  action: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  status: 'SUCCESS' | 'FAILED';
  error_message?: string | null;
  document?: string | null;
  document_title?: string | null;
  created_at: string;
}

export interface ProviderDetail {
  available?: boolean;
  configured?: boolean;
  base_url?: string;
  configured_model?: string;
  model?: string;
  models?: string[];
  embedding_model?: string;
  model_available?: boolean;
  available_models?: string[];
}

export interface AIConfig {
  provider: string;
  providers?: {
    gemini?: ProviderDetail;
    openrouter?: ProviderDetail;
    openai?: ProviderDetail;
    ollama?: ProviderDetail;
  };
  base_url?: string;
  configured_model: string;
  embedding_model: string;
  model_available: boolean;
  available_models: string[];
  max_input_length: number;
  timeout_seconds: number;
}
