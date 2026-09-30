export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  preferred_language: 'English' | 'Hindi' | 'Hinglish';
  preferred_tone: string;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponseData {
  user: User;
  tokens: AuthTokens;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    details: any;
  };
}
