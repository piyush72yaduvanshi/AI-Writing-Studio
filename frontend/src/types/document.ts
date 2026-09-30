export type WritingMode = 'blog' | 'article' | 'story' | 'movie_web_series' | 'screenplay' | 'custom';
export type WritingLanguage = 'English' | 'Hindi' | 'Hinglish';
export type WritingTone = 
  | 'Simple' 
  | 'Professional' 
  | 'Friendly' 
  | 'Creative' 
  | 'Formal' 
  | 'Casual' 
  | 'Cinematic' 
  | 'Emotional' 
  | 'Technical';

export interface DocumentItem {
  id: string;
  title: string;
  snippet?: string;
  content: string;
  ai_result: string;
  mode: WritingMode;
  language: WritingLanguage;
  tone: WritingTone;
  word_count: number;
  character_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document: string;
  version_number: number;
  title: string;
  content: string;
  ai_result: string;
  change_summary: string;
  created_at: string;
}

export interface PaginatedResult<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
