export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
}

export interface UserSettings {
  preferred_model: string;
  api_keys: {
    openai: string;
    deepseek: string;
    anthropic: string;
    kimi: string;
  };
  base_urls: {
    openai: string;
    deepseek: string;
    anthropic: string;
    kimi: string;
  };
}

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  message_type: string;
  filename?: string;
  file_path?: string;
  created_at: string;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  full_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}
