export type ReferenceCategory = 
  | 'guidelines'
  | 'screenplay_rules'
  | 'storytelling'
  | 'blog_standards'
  | 'formatting'
  | 'user_custom';

export type ReferenceStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface WritingReference {
  id: string;
  title: string;
  category: ReferenceCategory;
  is_global: boolean;
  status: ReferenceStatus;
  chunk_count: number;
  error_message?: string | null;
  text_content: string;
  created_at: string;
  updated_at: string;
}
